using System.Text.Json;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Options;
using AmsDiagnostic.Models;
using AmsDiagnostic.Services;

namespace AmsDiagnostic.Pages;

public class DebugModel : PageModel
{
    private readonly QualtricsService _qualtricsService;
    private readonly QualtricsSettings _settings;
    private readonly ILogger<DebugModel> _logger;

    public DebugModel(
        QualtricsService qualtricsService,
        IOptions<QualtricsSettings> settings,
        ILogger<DebugModel> logger)
    {
        _qualtricsService = qualtricsService;
        _settings = settings.Value;
        _logger = logger;
    }

    public string? ResponseId { get; set; }
    public string? RawJson { get; set; }
    public Dictionary<string, string>? ParsedAnswers { get; set; }
    public string? ErrorMessage { get; set; }
    public string SurveyId => _settings.SurveyId;
    public string DataCenter => _settings.DataCenter;

    public async Task OnGetAsync(string? response)
    {
        if (string.IsNullOrEmpty(response))
        {
            return;
        }

        ResponseId = response;

        try
        {
            _logger.LogInformation("Debug: Fetching response {ResponseId}", response);

            var responseDoc = await _qualtricsService.GetSurveyResponseAsync(response);

            if (responseDoc == null)
            {
                ErrorMessage = "Failed to retrieve response from Qualtrics API. Check your API token and response ID.";
                _logger.LogError("Debug: Failed to retrieve response");
                return;
            }

            // Format JSON with indentation for readability
            var options = new JsonSerializerOptions
            {
                WriteIndented = true
            };
            RawJson = JsonSerializer.Serialize(responseDoc, options);

            // Parse the answers
            ParsedAnswers = _qualtricsService.ParseSurveyResponse(responseDoc);

            _logger.LogInformation("Debug: Successfully loaded response with {Count} answers", ParsedAnswers.Count);
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error: {ex.Message}";
            _logger.LogError(ex, "Debug: Error fetching response");
        }
    }
}
