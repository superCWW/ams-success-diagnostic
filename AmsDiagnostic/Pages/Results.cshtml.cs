using Microsoft.AspNetCore.Mvc.RazorPages;
using AmsDiagnostic.Services;

namespace AmsDiagnostic.Pages
{
    public class ResultsModel : PageModel
    {
        private readonly ILogger<ResultsModel> _logger;
        private readonly QualtricsService _qualtricsService;
        private readonly ScoringService _scoringService;

        public ResultsModel(
            ILogger<ResultsModel> logger,
            QualtricsService qualtricsService,
            ScoringService scoringService)
        {
            _logger = logger;
            _qualtricsService = qualtricsService;
            _scoringService = scoringService;
        }

        public string? ResponseId { get; set; }
        public bool DataLoaded { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;

        public async Task OnGetAsync(string? response)
        {
            _logger.LogInformation("Results page accessed with response ID: {ResponseId}", response);

            ResponseId = response;

            // If no response ID provided, show default high performance for all sections
            if (string.IsNullOrEmpty(response))
            {
                _logger.LogWarning("No response ID provided, using default values");
                SetDefaultPerformanceTiers();
                return;
            }

            try
            {
                // Fetch survey response from Qualtrics
                var responseDoc = await _qualtricsService.GetSurveyResponseAsync(response);

                if (responseDoc == null)
                {
                    _logger.LogError("Failed to retrieve survey response from Qualtrics");
                    ErrorMessage = "Unable to retrieve survey data. Please try again later.";
                    SetDefaultPerformanceTiers();
                    return;
                }

                // Parse the survey response
                var surveyAnswers = _qualtricsService.ParseSurveyResponse(responseDoc);

                // Calculate performance tiers based on survey answers
                var performanceResults = _scoringService.CalculatePerformanceTiers(surveyAnswers);

                // Store results in ViewData for the view to access
                ViewData["Summary"] = performanceResults.Summary;
                ViewData["Foundation"] = performanceResults.Foundation;
                ViewData["Alignment"] = performanceResults.Alignment;
                ViewData["Adoption"] = performanceResults.Adoption;
                ViewData["Performance"] = performanceResults.Performance;
                ViewData["Improvement"] = performanceResults.Improvement;
                ViewData["ActionPlan"] = performanceResults.ActionPlan;

                DataLoaded = true;
                _logger.LogInformation("Successfully loaded and processed survey data");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing survey response");
                ErrorMessage = "An error occurred while processing your results. Please try again later.";
                SetDefaultPerformanceTiers();
            }
        }

        private void SetDefaultPerformanceTiers()
        {
            ViewData["Summary"] = "high";
            ViewData["Foundation"] = "high";
            ViewData["Alignment"] = "high";
            ViewData["Adoption"] = "high";
            ViewData["Performance"] = "high";
            ViewData["Improvement"] = "high";
            ViewData["ActionPlan"] = "high";
        }
    }
}
