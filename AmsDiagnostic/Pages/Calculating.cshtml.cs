using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AmsDiagnostic.Pages;

public class CalculatingModel : PageModel
{
    public string? ResponseId { get; set; }

    public void OnGet(string? response)
    {
        ResponseId = response;
    }
}
