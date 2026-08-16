# syntax=docker/dockerfile:1
# Build context MUST be the repository root, e.g.:
#   docker build -f deploy/docker/inquiry-api.Dockerfile -t mtart/inquiry-api .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY global.json Directory.Build.props Directory.Packages.props ./
COPY src/ src/

RUN dotnet restore src/Services/Inquiry/MTArt.Inquiry.Api/MTArt.Inquiry.Api.csproj
RUN dotnet publish src/Services/Inquiry/MTArt.Inquiry.Api/MTArt.Inquiry.Api.csproj \
    -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
COPY --from=build /app .
USER $APP_UID
ENTRYPOINT ["dotnet", "MTArt.Inquiry.Api.dll"]
