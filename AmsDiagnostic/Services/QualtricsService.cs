using System.Text.Json;
using AmsDiagnostic.Models;
using Microsoft.Extensions.Options;

namespace AmsDiagnostic.Services;

public class QualtricsService
{
    private readonly HttpClient _httpClient;
    private readonly QualtricsSettings _settings;
    private readonly ILogger<QualtricsService> _logger;

    public QualtricsService(
        HttpClient httpClient,
        IOptions<QualtricsSettings> settings,
        ILogger<QualtricsService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;

        // Configure HttpClient base address and headers
        _httpClient.BaseAddress = new Uri($"https://{_settings.DataCenter}.qualtrics.com/API/v3/");
        _httpClient.DefaultRequestHeaders.Add("X-API-TOKEN", _settings.ApiToken);
    }

    public async Task<JsonDocument?> GetSurveyResponseAsync(string responseId)
    {
        try
        {
            _logger.LogInformation("Fetching survey response {ResponseId} from Qualtrics", responseId);

            var response = await _httpClient.GetAsync(
                $"surveys/{_settings.SurveyId}/responses/{responseId}"
            );

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Failed to fetch survey response. Status: {StatusCode}, Reason: {Reason}",
                    response.StatusCode,
                    response.ReasonPhrase
                );
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Successfully retrieved survey response");

            return JsonDocument.Parse(content);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching survey response from Qualtrics");
            return null;
        }
    }

    public Dictionary<string, string> ParseSurveyResponse(JsonDocument responseDoc)
    {
        var answers = new Dictionary<string, string>();

        try
        {
            // Navigate to the values object in the response
            if (responseDoc.RootElement.TryGetProperty("result", out var result) &&
                result.TryGetProperty("values", out var values))
            {
                foreach (var property in values.EnumerateObject())
                {
                    answers[property.Name] = property.Value.ToString();
                }
            }

            _logger.LogInformation("Parsed {Count} survey answers", answers.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing survey response");
        }

        return answers;
    }
}
