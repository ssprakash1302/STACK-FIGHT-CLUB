"""Singleton Anthropic Bedrock client and completion helper."""

import os
from functools import lru_cache

from anthropic import AnthropicBedrock
from dotenv import load_dotenv

load_dotenv()


@lru_cache(maxsize=1)
def get_bedrock_client() -> AnthropicBedrock:
    kwargs: dict = {}
    region = os.environ.get("AWS_REGION")
    if region:
        kwargs["aws_region"] = region
    key = os.environ.get("AWS_ACCESS_KEY_ID")
    secret = os.environ.get("AWS_SECRET_ACCESS_KEY")
    token = os.environ.get("AWS_SESSION_TOKEN")
    if key:
        kwargs["aws_access_key"] = key
    if secret:
        kwargs["aws_secret_key"] = secret
    if token:
        kwargs["aws_session_token"] = token
    return AnthropicBedrock(**kwargs)


def get_bedrock_model_id() -> str:
    mid = os.environ.get("BEDROCK_MODEL_ID")
    if not mid:
        raise RuntimeError(
            "BEDROCK_MODEL_ID is not set. Set it in .env to your Bedrock model id "
            "(e.g. anthropic.claude-sonnet-4-6 or global.anthropic.claude-sonnet-4-6-v1)."
        )
    return mid


def complete(system: str, user: str, max_tokens: int) -> str:
    client = get_bedrock_client()
    model = get_bedrock_model_id()
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    block = response.content[0]
    if hasattr(block, "text"):
        return block.text
    return str(block)
