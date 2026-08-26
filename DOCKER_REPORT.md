# Dockerfile Analysis Report
# ===========================
# This Dockerfile is well-structured for production with multi-stage builds.
# Improvements made via deploy scripts.
#
# Key Features:
# - Multi-stage build (dependencies, builder, runner)
# - Non-root user (nextjs:nodejs)
# - Minimal Alpine-based production image
# - Prisma client generation included
# - Standalone output mode for Next.js
#
# Note: The Dockerfile uses `pnpm` via corepack. Ensure corepack is enabled in build environment.
