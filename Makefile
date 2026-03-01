.PHONY: build run stop dev clean

# Start everything: Docker (nginx) + Backend on host (for claude-cli)
dev:
	docker compose up -d
	env -u CLAUDECODE -u CLAUDE_CODE_SSE_PORT -u CLAUDE_CODE_ENTRYPOINT \
		bash -c 'set -a && source .env && set +a && PORT=3001 exec node backend/server.js'

# Docker mode (for openai/anthropic providers — no claude CLI needed)
build:
	docker compose build

run:
	docker compose up -d

stop:
	docker compose down

logs:
	docker compose logs -f

clean:
	docker compose down -v --rmi local
