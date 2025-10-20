'use client'

import { useState, useEffect, useCallback } from 'react'
import { Portfolio } from '@/lib/api/portfolios'

export interface PortfolioModalState {
  isOpen: boolean
  portfolio: Portfolio | null
  currentImageIndex: number
}

export function usePortfolioModal() {
  const [state, setState] = useState<PortfolioModalState>({
    isOpen: false,
    portfolio: null,
    currentImageIndex: 0
  })

  // Helper function to get all images (thumbnail + additional images)
  const getAllImages = useCallback((portfolio: Portfolio): string[] => {
    const allImages: string[] = []
    
    // Add thumbnail first if it exists
    if (portfolio.thumbnail) {
      allImages.push(portfolio.thumbnail)
    }
    
    // Add additional images, but avoid duplicates
    portfolio.images.forEach(image => {
      if (!allImages.includes(image)) {
        allImages.push(image)
      }
    })
    
    return allImages
  }, [])

  // Open modal with portfolio
  const openModal = useCallback((portfolio: Portfolio, imageIndex = 0) => {
    const allImages = getAllImages(portfolio)
    setState({
      isOpen: true,
      portfolio,
      currentImageIndex: Math.max(0, Math.min(imageIndex, allImages.length - 1))
    })
  }, [getAllImages])

  // Close modal
  const closeModal = useCallback(() => {
    setState({
      isOpen: false,
      portfolio: null,
      currentImageIndex: 0
    })
  }, [])

  // Navigate to previous image
  const previousImage = useCallback(() => {
    setState(prev => {
      if (!prev.portfolio) return prev
      const allImages = getAllImages(prev.portfolio)
      if (allImages.length <= 1) return prev
      
      return {
        ...prev,
        currentImageIndex: prev.currentImageIndex > 0 
          ? prev.currentImageIndex - 1 
          : allImages.length - 1
      }
    })
  }, [getAllImages])

  // Navigate to next image
  const nextImage = useCallback(() => {
    setState(prev => {
      if (!prev.portfolio) return prev
      const allImages = getAllImages(prev.portfolio)
      if (allImages.length <= 1) return prev
      
      return {
        ...prev,
        currentImageIndex: prev.currentImageIndex < allImages.length - 1
          ? prev.currentImageIndex + 1 
          : 0
      }
    })
  }, [getAllImages])

  // Go to specific image index
  const goToImage = useCallback((index: number) => {
    setState(prev => {
      if (!prev.portfolio) return prev
      const allImages = getAllImages(prev.portfolio)
      
      return {
        ...prev,
        currentImageIndex: Math.max(0, Math.min(index, allImages.length - 1))
      }
    })
  }, [getAllImages])

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!state.isOpen) return

    switch (event.key) {
      case 'Escape':
        closeModal()
        break
      case 'ArrowLeft':
        previousImage()
        break
      case 'ArrowRight':
        nextImage()
        break
    }
  }, [state.isOpen, closeModal, previousImage, nextImage])

  // Set up keyboard listeners
  useEffect(() => {
    if (state.isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'unset'
      }
    }
  }, [state.isOpen, handleKeyDown])

  return {
    ...state,
    openModal,
    closeModal,
    previousImage,
    nextImage,
    goToImage,
    hasMultipleImages: state.portfolio ? getAllImages(state.portfolio).length > 1 : false,
    currentImage: state.portfolio ? getAllImages(state.portfolio)[state.currentImageIndex] : null,
    imageCount: state.portfolio ? getAllImages(state.portfolio).length : 0
  }
}