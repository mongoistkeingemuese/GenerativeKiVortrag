Commit all changes and deploy the REX presentation container locally.

Run the following steps:
1. Check `git status` and `git diff` for pending changes
2. If there are changes: stage all relevant files and create a commit with a concise German commit message describing the changes
3. `make build` — Build the Docker image
4. `make run` — Start the container (detached)
5. Verify the container is running with `docker compose ps`
6. Report the result and remind the user the presentation is available at http://localhost:8080
