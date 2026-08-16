# syntax=docker/dockerfile:1
# Build context MUST be the repository root, e.g.:
#   docker build -f deploy/docker/notification-worker.Dockerfile -t mtart/notification-worker .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY global.json Directory.Build.props Directory.Packages.props ./
COPY src/ src/

RUN dotnet restore src/Services/Notification/MTArt.Notification.Worker/MTArt.Notification.Worker.csproj
RUN dotnet publish src/Services/Notification/MTArt.Notification.Worker/MTArt.Notification.Worker.csproj \
    -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/runtime:10.0 AS final
WORKDIR /app
ENV DOTNET_ENVIRONMENT=Production
COPY --from=build /app .
USER $APP_UID
ENTRYPOINT ["dotnet", "MTArt.Notification.Worker.dll"]
