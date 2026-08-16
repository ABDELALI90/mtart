# syntax=docker/dockerfile:1
# Build context MUST be the repository root, e.g.:
#   docker build -f deploy/docker/catalog-api.Dockerfile -t mtart/catalog-api .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY global.json Directory.Build.props Directory.Packages.props ./
COPY src/ src/

RUN dotnet restore src/Services/Catalog/MTArt.Catalog.Api/MTArt.Catalog.Api.csproj
RUN dotnet publish src/Services/Catalog/MTArt.Catalog.Api/MTArt.Catalog.Api.csproj \
    -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
COPY --from=build /app .
USER $APP_UID
ENTRYPOINT ["dotnet", "MTArt.Catalog.Api.dll"]
