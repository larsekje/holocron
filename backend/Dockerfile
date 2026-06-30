FROM python:3.9
WORKDIR app

# Virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Upgrade pip
RUN python3 -m pip install --upgrade pip

# Install runtime dependencies directly with pip.
# We deliberately do NOT run poetry in the image: poetry's tooling pulls in
# cryptography / keyring, whose wheels SIGILL ("Illegal instruction", exit 132)
# in this build environment — the failure was inside poetry, not the app's deps.
# The application itself needs none of that. These are the runtime deps from
# pyproject.toml ([tool.poetry.dependencies]); pip resolves their transitives.
RUN pip install \
      "fastapi>=0.88,<0.89" \
      "dependency-injector>=4.40,<5" \
      "uvicorn>=0.20,<0.21" \
      "pyyaml>=6,<7" \
      "xmltodict>=0.13,<0.14" \
      "httpx>=0.23.1,<0.24" \
      "trio>=0.22,<0.23"

# Copy application
COPY backend/ ./
CMD ["-m", "holocron.app"]
ENTRYPOINT ["python"]