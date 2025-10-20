import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5003'
    const fileUrl = `${backendUrl}/uploads/${path}`

    console.log('Proxying file request:', fileUrl)

    const response = await fetch(fileUrl)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const blob = await response.blob()
    const headers = new Headers()
    headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream')
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return new NextResponse(blob, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error proxying file:', error)
    return NextResponse.json(
      { error: 'Failed to load file' },
      { status: 500 }
    )
  }
}
