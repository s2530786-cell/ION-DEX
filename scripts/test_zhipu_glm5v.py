#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Zhipu glm-5v-turbo (zai-sdk) smoke tests. API key via ZHIPU_API_KEY env only."""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request
import uuid


def _client():
    from zai import ZhipuAiClient

    key = os.environ.get("ZHIPU_API_KEY", "").strip()
    if not key:
        print("Set ZHIPU_API_KEY before running.", file=sys.stderr)
        sys.exit(1)
    return ZhipuAiClient(api_key=key)


def _print_safe(value: object) -> None:
    text = str(value)
    enc = sys.stdout.encoding or "utf-8"
    safe = text.encode(enc, errors="replace").decode(enc, errors="replace")
    print(safe, flush=True)


def _api_key() -> str:
    key = os.environ.get("ZHIPU_API_KEY", "").strip()
    if not key:
        print("Set ZHIPU_API_KEY before running.", file=sys.stderr)
        sys.exit(1)
    return key


def _post_json(url: str, payload: dict, timeout_s: int = 120) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {_api_key()}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code}: {body}", file=sys.stderr)
        raise


def _get_json(url: str, timeout_s: int = 120) -> dict:
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {_api_key()}",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code}: {body}", file=sys.stderr)
        raise


def test_version() -> None:
    import zai

    print("zai-sdk", zai.__version__)


def test_image_grounding(model: str) -> None:
    client = _client()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://cloudcovert-1305175928.cos.ap-guangzhou.myqcloud.com/%E5%9B%BE%E7%89%87grounding.PNG"
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Where is the second bottle of beer from the right on the table? "
                            "Provide coordinates in [[xmin,ymin,xmax,ymax]] format"
                        ),
                    },
                ],
            }
        ],
        thinking={"type": "enabled"},
    )
    _print_safe(response.choices[0].message)


def test_text_chat(model: str) -> None:
    client = _client()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": "作为一名营销专家，请为我的产品创作一个吸引人的口号"},
            {"role": "assistant", "content": "当然，要创作一个吸引人的口号，请告诉我一些关于您产品的信息"},
            {"role": "user", "content": "智谱开放平台"},
        ],
        thinking={"type": "enabled"},
        max_tokens=4096,
        temperature=1.0,
    )
    _print_safe(response.choices[0].message)


def test_text_stream(model: str) -> None:
    client = _client()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": "作为一名营销专家，请为我的产品创作一个吸引人的口号"},
            {"role": "assistant", "content": "当然，要创作一个吸引人的口号，请告诉我一些关于您产品的信息"},
            {"role": "user", "content": "智谱开放平台"},
        ],
        thinking={"type": "enabled"},
        max_tokens=4096,
        temperature=1.0,
        stream=True,
    )
    for chunk in response:
        delta = chunk.choices[0].delta
        if getattr(delta, "reasoning_content", None):
            print(delta.reasoning_content, end="", flush=True)
        if getattr(delta, "content", None):
            print(delta.content, end="", flush=True)
    print()


def test_image_multi(model: str) -> None:
    client = _client()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": "https://cdn.bigmodel.cn/static/logo/register.png"},
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": "https://cdn.bigmodel.cn/static/logo/api-key.png"},
                    },
                    {"type": "text", "text": "What are the pics talk about?"},
                ],
            }
        ],
        thinking={"type": "enabled"},
    )
    _print_safe(response.choices[0].message)


def test_stream(model: str) -> None:
    client = _client()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://cloudcovert-1305175928.cos.ap-guangzhou.myqcloud.com/%E5%9B%BE%E7%89%87grounding.PNG"
                        },
                    },
                    {"type": "text", "text": "Describe the scene briefly."},
                ],
            }
        ],
        thinking={"type": "enabled"},
        stream=True,
    )
    for chunk in response:
        delta = chunk.choices[0].delta
        if getattr(delta, "reasoning_content", None):
            print(delta.reasoning_content, end="", flush=True)
        if getattr(delta, "content", None):
            print(delta.content, end="", flush=True)
    print()


def test_video(model: str) -> None:
    client = _client()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "video_url",
                        "video_url": {"url": "https://cdn.bigmodel.cn/agent-demos/lark/113123.mov"},
                    },
                    {"type": "text", "text": "What does the video show about?"},
                ],
            }
        ],
        thinking={"type": "enabled"},
    )
    _print_safe(response.choices[0].message)


def test_file(model: str) -> None:
    client = _client()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "file_url", "file_url": {"url": "https://cdn.bigmodel.cn/static/demo/demo2.txt"}},
                    {"type": "file_url", "file_url": {"url": "https://cdn.bigmodel.cn/static/demo/demo1.pdf"}},
                    {"type": "text", "text": "What do the files talk about?"},
                ],
            }
        ],
        thinking={"type": "enabled"},
    )
    _print_safe(response.choices[0].message)


def _guess_mime(path: str) -> str:
    mime, _ = mimetypes.guess_type(path)
    return mime or "application/octet-stream"


def test_base64(model: str, image_path: str, raw_base64: bool) -> None:
    client = _client()
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    url = b64 if raw_base64 else f"data:{_guess_mime(image_path)};base64,{b64}"
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": url}},
                    {"type": "text", "text": "请描述这个图片"},
                ],
            }
        ],
        thinking={"type": "enabled"},
    )
    _print_safe(response.choices[0].message)


def create_video_async(
    model: str,
    prompt: str,
    api_base: str,
    quality: str,
    with_audio: bool,
    size: str,
    fps: int,
    duration: int,
    image_url: str | None,
) -> None:
    request_id = str(uuid.uuid4())
    payload: dict[str, object] = {
        "model": model,
        "prompt": prompt,
        "quality": quality,
        "with_audio": with_audio,
        "size": size,
        "fps": fps,
        "duration": duration,
        "request_id": request_id,
    }
    if image_url:
        payload["image_url"] = image_url
    data = _post_json(f"{api_base}/videos/generations", payload)
    print(json.dumps(data, ensure_ascii=False, indent=2))


def fetch_async_result(
    task_id: str,
    api_base: str,
    async_result_path_template: str,
) -> dict:
    path = async_result_path_template.format(task_id=task_id).lstrip("/")
    return _get_json(f"{api_base}/{path}")


def poll_async_result(
    task_id: str,
    api_base: str,
    async_result_path_template: str,
    interval_s: int,
    timeout_s: int,
) -> None:
    start = time.time()
    while True:
        data = fetch_async_result(task_id, api_base, async_result_path_template)
        print(json.dumps(data, ensure_ascii=False, indent=2))
        status = str(data.get("task_status", "")).upper()
        if status in {"SUCCESS", "FAIL"}:
            return
        if time.time() - start >= timeout_s:
            print("Polling timeout reached.", file=sys.stderr)
            sys.exit(2)
        time.sleep(interval_s)


def main() -> None:
    parser = argparse.ArgumentParser(description="Zhipu scripts toolkit (SDK + REST async)")
    parser.add_argument(
        "--model",
        default="glm-5v-turbo",
        help="model name (default: glm-5v-turbo)",
    )
    parser.add_argument(
        "--api-base",
        default="https://open.bigmodel.cn/api/paas/v4",
        help="REST API base url (default: https://open.bigmodel.cn/api/paas/v4)",
    )
    parser.add_argument(
        "--task-id",
        default="",
        help="task id for async-result / async-poll",
    )
    parser.add_argument(
        "--prompt",
        default="A cat is playing with a ball.",
        help="prompt for video-async-create",
    )
    parser.add_argument(
        "--quality",
        choices=["speed", "quality"],
        default="speed",
        help="video quality mode",
    )
    parser.add_argument(
        "--with-audio",
        action="store_true",
        help="enable AI audio for video-async-create",
    )
    parser.add_argument(
        "--size",
        default="1920x1080",
        help="video size for video-async-create",
    )
    parser.add_argument(
        "--fps",
        type=int,
        choices=[30, 60],
        default=30,
        help="video fps for video-async-create",
    )
    parser.add_argument(
        "--duration",
        type=int,
        choices=[5, 10],
        default=5,
        help="video duration seconds for video-async-create",
    )
    parser.add_argument(
        "--video-image-url",
        default="",
        help="optional image_url for image-to-video",
    )
    parser.add_argument(
        "--async-result-path-template",
        default="/async-result/{task_id}",
        help="async result path template under api-base",
    )
    parser.add_argument(
        "--poll-interval",
        type=int,
        default=5,
        help="poll interval seconds for async-poll",
    )
    parser.add_argument(
        "--poll-timeout",
        type=int,
        default=300,
        help="poll timeout seconds for async-poll",
    )
    parser.add_argument(
        "mode",
        choices=[
            "version",
            "text",
            "text-stream",
            "grounding",
            "multi",
            "stream",
            "video",
            "file",
            "base64",
            "video-async-create",
            "async-result",
            "async-poll",
        ],
        default="version",
        nargs="?",
        help="test mode (default: version)",
    )
    parser.add_argument(
        "--image-path",
        default="",
        help="local image path for base64 mode",
    )
    parser.add_argument(
        "--raw-base64",
        action="store_true",
        help="send raw base64 string (default sends data:...;base64,...)",
    )
    args = parser.parse_args()
    if args.mode == "version":
        test_version()
    elif args.mode == "text":
        test_text_chat(args.model)
    elif args.mode == "text-stream":
        test_text_stream(args.model)
    elif args.mode == "grounding":
        test_image_grounding(args.model)
    elif args.mode == "multi":
        test_image_multi(args.model)
    elif args.mode == "stream":
        test_stream(args.model)
    elif args.mode == "video":
        test_video(args.model)
    elif args.mode == "file":
        test_file(args.model)
    elif args.mode == "base64":
        if not args.image_path:
            print("--image-path is required for base64 mode", file=sys.stderr)
            sys.exit(2)
        test_base64(args.model, args.image_path, args.raw_base64)
    elif args.mode == "video-async-create":
        create_video_async(
            model=args.model,
            prompt=args.prompt,
            api_base=args.api_base.rstrip("/"),
            quality=args.quality,
            with_audio=args.with_audio,
            size=args.size,
            fps=args.fps,
            duration=args.duration,
            image_url=args.video_image_url.strip() or None,
        )
    elif args.mode == "async-result":
        if not args.task_id:
            print("--task-id is required for async-result", file=sys.stderr)
            sys.exit(2)
        data = fetch_async_result(
            task_id=args.task_id,
            api_base=args.api_base.rstrip("/"),
            async_result_path_template=args.async_result_path_template,
        )
        print(json.dumps(data, ensure_ascii=False, indent=2))
    elif args.mode == "async-poll":
        if not args.task_id:
            print("--task-id is required for async-poll", file=sys.stderr)
            sys.exit(2)
        poll_async_result(
            task_id=args.task_id,
            api_base=args.api_base.rstrip("/"),
            async_result_path_template=args.async_result_path_template,
            interval_s=args.poll_interval,
            timeout_s=args.poll_timeout,
        )


if __name__ == "__main__":
    main()
