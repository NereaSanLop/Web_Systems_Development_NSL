SHELL := /bin/bash

PYTHON ?= python3
PIP ?= $(PYTHON) -m pip
UVICORN ?= $(PYTHON) -m uvicorn
BACKEND_DIR := backend
FRONTEND_DIR := frontend

.PHONY: help install install-back install-front back front stop dev

help:
	@echo "Available targets:"
	@echo "  make install      -> Install backend and frontend dependencies"
	@echo "  make install-back -> Install backend dependencies"
	@echo "  make install-front-> Install frontend dependencies"
	@echo "  make back         -> Run backend only (http://127.0.0.1:8000)"
	@echo "  make front        -> Run frontend only (http://localhost:3000)"
	@echo "  make stop         -> Stop processes on ports 8000 and 3000"
	@echo "  make dev          -> Run backend and frontend together"

install: install-back install-front

install-back:
	$(PIP) install -r requirements.txt

install-front:
	cd $(FRONTEND_DIR) && npm install

back:
	cd $(BACKEND_DIR) && $(UVICORN) app.main:app --reload

front:
	cd $(FRONTEND_DIR) && npm start

stop:
	@PIDS=$$(lsof -t -iTCP:8000 -sTCP:LISTEN 2>/dev/null); \
	if [ -n "$$PIDS" ]; then kill $$PIDS 2>/dev/null || true; fi
	@PIDS=$$(lsof -t -iTCP:3000 -sTCP:LISTEN 2>/dev/null); \
	if [ -n "$$PIDS" ]; then kill $$PIDS 2>/dev/null || true; fi
	@pkill -f 'react-scripts/scripts/start.js' 2>/dev/null || true
	@pkill -f 'node_modules/.bin/react-scripts start' 2>/dev/null || true

dev: stop
	@set -m; \
	(cd $(BACKEND_DIR) && $(UVICORN) app.main:app --reload) & BACK_PID=$$!; \
	(cd $(FRONTEND_DIR) && npm start) & FRONT_PID=$$!; \
	trap 'kill $$BACK_PID $$FRONT_PID 2>/dev/null' INT TERM EXIT; \
	wait $$BACK_PID $$FRONT_PID
