# 🚀 Quick Start: Get Your Code on GitHub (5 Minutes)

## Prerequisites
- GitHub account (create one at https://github.com/signup if needed)
- Git installed (check by running `git --version` in terminal)

---

## Step 1: Open Terminal in Project Folder

```bash
# Windows Command Prompt or PowerShell:
cd c:\Users\taylo\Desktop\ROWFLOW_MVP_STRUCTURE
```

---

## Step 2: Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: KoiHire MVP platform"
```

---

## Step 3: Create GitHub Repository

1. Go to: https://github.com/new
2. Fill in:
   - **Repository name:** `koihire`
   - **Description:** "Dual marketplace platform for freelancers and clients"
   - **Visibility:** ✅ Private (recommended)
   - **DO NOT** check any initialize options
3. Click **"Create repository"**

---

## Step 4: Connect & Push to GitHub

GitHub shows you commands after creating the repo. Copy and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/koihire.git
git branch -M main
git push -u origin main
```

**⚠️ Important:** Replace `YOUR_USERNAME` with your actual GitHub username!

**Example:**
```bash
git remote add origin https://github.com/johndoe/koihire.git
git branch -M main
git push -u origin main
```

---

## Step 5: Verify Upload

1. Go to: `https://github.com/YOUR_USERNAME/koihire`
2. You should see all your code!
3. Check that these files are there:
   - ✅ `README.md`
   - ✅ `DEPLOYMENT_GUIDE.md`
   - ✅ `frontend/` folder
   - ✅ `backend/` folder
   - ✅ `.gitignore`

---

## Step 6: Invite Your Stripe Friend for Review

1. In your repo, click **Settings** (top navigation)
2. Click **Collaborators** (left sidebar)
3. Click **Add people** button
4. Enter their GitHub username or email
5. Click **Add [username] to this repository**
6. They'll get an email invite!

---

## 🎉 Done!

Your code is now on GitHub and ready for review!

---

## Common Issues & Solutions

### "git: command not found"
**Solution:** Install Git from https://git-scm.com/download/win

### "Permission denied (publickey)"
**Solution:** You need to set up SSH keys or use HTTPS instead:
```bash
# Use HTTPS (easier):
git remote set-url origin https://github.com/YOUR_USERNAME/koihire.git
```

### "remote origin already exists"
**Solution:** Remove and re-add:
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/koihire.git
```

### "! [rejected] main -> main (fetch first)"
**Solution:** Force push (only safe on first push):
```bash
git push -u origin main --force
```

---

## Next Steps

1. ✅ Code is on GitHub
2. ⏭️ **Next:** Set up Stripe (see `DEPLOYMENT_GUIDE.md`)
3. ⏭️ **Then:** Deploy to production
4. ⏭️ **Finally:** Set up email notifications

---

## Useful Git Commands for Later

```bash
# Check status of changes
git status

# Add new changes
git add .

# Commit changes
git commit -m "Add feature X"

# Push to GitHub
git push

# Pull latest from GitHub
git pull

# See commit history
git log --oneline

# Create new branch for features
git checkout -b feature-name
```

---

**Need help? Just ask!** 🚀
