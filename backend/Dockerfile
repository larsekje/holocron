FROM python:3.9
WORKDIR app

# Virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Upgrade pip
RUN python3 -m pip install pip==22.3.1

RUN pip install pipenv

# Install dependencies
COPY backend/pyproject.toml .
COPY backend/poetry.lock .
RUN pip install poetry
RUN poetry install

# Copy application
COPY backend/ ./
CMD ["-m", "holocron.app"]
ENTRYPOINT ["python"]