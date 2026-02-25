.PHONY: build run stop dev clean

build:
	docker compose build

run:
	docker compose up -d

stop:
	docker compose down

dev:
	docker compose up

logs:
	docker compose logs -f

clean:
	docker compose down -v --rmi local
