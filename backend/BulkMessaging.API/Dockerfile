FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["BulkMessaging.API.csproj", "./"]
RUN dotnet restore "BulkMessaging.API.csproj"

COPY . .
RUN dotnet publish "BulkMessaging.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "BulkMessaging.API.dll"]