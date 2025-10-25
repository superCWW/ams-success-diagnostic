using AmsDiagnostic.Data;
using AmsDiagnostic.Models;
using AmsDiagnostic.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddSingleton<DatabaseHelper>();

// Configure Qualtrics settings
builder.Services.Configure<QualtricsSettings>(
    builder.Configuration.GetSection("Qualtrics"));

// Register Qualtrics service with HttpClient
builder.Services.AddHttpClient<QualtricsService>();

// Register Scoring service
builder.Services.AddScoped<ScoringService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseAuthorization();

app.MapStaticAssets();
app.MapRazorPages()
   .WithStaticAssets();

app.Run();
