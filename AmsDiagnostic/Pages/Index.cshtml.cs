using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AmsDiagnostic.Pages;

public class IndexModel : PageModel
{
    private readonly ILogger<IndexModel> _logger;

    public IndexModel(ILogger<IndexModel> logger)
    {
        _logger = logger;
    }

    public IActionResult OnGet(string? response)
    {
        // Redirect to Calculating page with response parameter
        if (!string.IsNullOrEmpty(response))
        {
            return RedirectToPage("/Calculating", new { response });
        }

        return RedirectToPage("/Calculating");
    }
}
