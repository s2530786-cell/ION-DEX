# AI Studio — Architecture Document

## Overview
AI Studio is a standalone service that provides multi-model inference, image generation, and audio processing for ION DEX.

## Architecture

```
┌─────────────────────────────────────────────┐
│                 AI Studio API                │
│         (Next.js API Routes / Edge)          │
├─────────────────────────────────────────────┤
│  Text Chat  │  Image Gen  │  Audio TTS/STT  │
├─────────────────────────────────────────────┤
│              Model Router                    │
│  ┌─────────┬──────────┬──────────────────┐  │
│  │  GLM    │ DeepSeek │  Doubao Vision   │  │
│  │  5.1    │  V4      │  Seedream 4/5    │  │
│  └─────────┴──────────┴──────────────────┘  │
├─────────────────────────────────────────────┤
│           Provider Adapters                  │
│  ┌──────────┬──────────┬─────────────────┐  │
│  │ YuanyuAI │ 火山引擎  │  GitHub Models  │  │
│  └──────────┴──────────┴─────────────────┘  │
└─────────────────────────────────────────────┘
```

## Service Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | POST | Text chat completion |
| `/api/ai/image` | POST | Image generation |
| `/api/ai/vision` | POST | Image analysis |
| `/api/ai/audio` | POST | TTS / STT |

## Configuration
- Environment variables: `ARK_API_KEY`, `YUANYUAI_API_KEY`, `GITHUB_TOKEN`
- Proxy: HTTP_PROXY/HTTPS_PROXY required for external API access
