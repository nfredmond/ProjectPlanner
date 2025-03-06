# Branching Strategy

This document outlines the branching strategy used in the ProjectPlanner repository to maintain code quality and organize development workflow.

## Branch Structure

Our repository maintains the following primary branches:

### 1. `master` Branch
- Contains production-ready code
- Always stable and deployable
- Protected from direct commits
- Changes come from `develop` branch via pull requests

### 2. `develop` Branch
- Integration branch for ongoing development
- Features are merged here for testing before production
- Should be relatively stable
- Base branch for feature development

### 3. `portable-app` Branch
- Specialized branch for the portable/offline version of the application
- May contain specific modifications for standalone operation
- Periodically synced with `develop` branch

## Workflow Guidelines

### Feature Development

1. **Create Feature Branch**
   ```bash
   # Start from develop branch
   git checkout develop
   git pull origin develop
   
   # Create a feature branch
   git checkout -b feature/descriptive-name develop
   ```

2. **Work on Feature**
   ```bash
   # Make changes and commit them
   git add .
   git commit -m "Meaningful description of changes"
   ```

3. **Keep Feature Branch Updated**
   ```bash
   # Periodically sync with develop
   git checkout develop
   git pull origin develop
   git checkout feature/descriptive-name
   git merge develop
   ```

4. **Submit Changes**
   ```bash
   # Push your branch to GitHub
   git push -u origin feature/descriptive-name
   
   # Create a pull request to merge into develop
   ```

5. **Cleanup**
   ```bash
   # After merge, delete the feature branch
   git checkout develop
   git pull origin develop
   git branch -d feature/descriptive-name
   ```

### Releasing to Production

1. **Prepare Release**
   ```bash
   # Create a release branch if needed for final testing
   git checkout develop
   git checkout -b release/vX.Y.Z
   
   # Make any final version adjustments
   git commit -m "Bump version to X.Y.Z"
   ```

2. **Deploy to Production**
   ```bash
   # Merge to master
   git checkout master
   git pull origin master
   git merge --no-ff release/vX.Y.Z -m "Release version X.Y.Z"
   git tag -a vX.Y.Z -m "Version X.Y.Z"
   git push origin master --tags
   
   # Update develop
   git checkout develop
   git merge --no-ff release/vX.Y.Z -m "Merge release back to develop"
   git push origin develop
   
   # Cleanup
   git branch -d release/vX.Y.Z
   ```

### Portable App Development

1. **Implement Portable-Specific Features**
   ```bash
   # Switch to portable-app branch
   git checkout portable-app
   git pull origin portable-app
   
   # Create feature branch for portable app
   git checkout -b portable-feature/name portable-app
   
   # Work on features specific to portable version
   ```

2. **Sync with Main Development**
   ```bash
   # Periodically sync portable-app with develop
   git checkout portable-app
   git merge --no-ff develop
   # Resolve any conflicts
   git push origin portable-app
   ```

## Branch Naming Conventions

- Feature branches: `feature/descriptive-name`
- Bug fixes: `bugfix/issue-description`
- Hotfixes: `hotfix/critical-issue`
- Releases: `release/vX.Y.Z`
- Portable app features: `portable-feature/name`

## Best Practices

1. **Commit Guidelines**
   - Write clear, meaningful commit messages
   - Keep commits focused on single changes
   - Reference issue numbers when applicable

2. **Pull Request Workflow**
   - Create descriptive pull request titles and descriptions
   - Reference related issues
   - Request code reviews from team members
   - Ensure CI checks pass before merging

3. **Branch Management**
   - Delete branches after they're merged
   - Keep feature branches short-lived
   - Regularly sync with parent branches

4. **Protection Rules**
   - `master` and `develop` should be protected branches
   - Require pull request reviews before merging
   - Consider enabling CI/test requirements for merges

This strategy is designed to maintain code quality while allowing for efficient development workflows. It may evolve over time as project needs change. 