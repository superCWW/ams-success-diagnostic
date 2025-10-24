using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AmsDiagnostic.Pages
{
    public class ResultsModel : PageModel
    {
        private readonly ILogger<ResultsModel> _logger;

        public ResultsModel(ILogger<ResultsModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            _logger.LogInformation("Results page accessed");
        }
    }
}
