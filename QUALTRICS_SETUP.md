# Qualtrics API Integration Setup

## Overview
This application integrates with Qualtrics to retrieve survey responses and dynamically display performance results based on the survey data.

## Configuration

### 1. Set Your API Token
Update the API token in `appsettings.json`:

```json
"Qualtrics": {
  "ApiToken": "YOUR_ACTUAL_API_TOKEN_HERE",
  "DataCenter": "iad1",
  "SurveyId": "SV_1zyYQ9I5tRHvNNc"
}
```

**IMPORTANT**: Never commit your real API token to git. For production, use environment variables or Azure Key Vault.

### 2. Using User Secrets (Recommended for Development)
Instead of storing the API token in appsettings.json, use User Secrets:

```bash
cd AmsDiagnostic
dotnet user-secrets init
dotnet user-secrets set "Qualtrics:ApiToken" "YOUR_ACTUAL_API_TOKEN"
```

## Usage

### Accessing Results
Users access their results via URL with a query string parameter:

```
https://yourdomain.com/Results?response=R_XXXXXXXXXXXXX
```

Where `R_XXXXXXXXXXXXX` is the Qualtrics response ID.

### Without Response ID
If no response ID is provided, the application will show default "high" performance for all sections.

## Architecture

### Services Created

1. **QualtricsService** (`Services/QualtricsService.cs`)
   - Handles API communication with Qualtrics
   - Methods:
     - `GetSurveyResponseAsync(responseId)` - Fetches raw survey data
     - `ParseSurveyResponse(responseDoc)` - Parses JSON response into dictionary

2. **ScoringService** (`Services/ScoringService.cs`)
   - Calculates performance tiers based on survey answers
   - Method: `CalculatePerformanceTiers(surveyAnswers)`
   - Returns: `PerformanceResults` object with tier for each section

3. **ResultsModel** (`Pages/Results.cshtml.cs`)
   - Orchestrates the data flow
   - Fetches survey data via QualtricsService
   - Calculates tiers via ScoringService
   - Passes results to view via ViewData

### Data Flow

```
URL: /Results?response=R_XXX
         ↓
OnGetAsync(response)
         ↓
QualtricsService.GetSurveyResponseAsync()
         ↓
QualtricsService.ParseSurveyResponse()
         ↓
ScoringService.CalculatePerformanceTiers()
         ↓
ViewData["Summary"] = "high"
ViewData["Foundation"] = "medium"
... etc ...
         ↓
Results.cshtml (JavaScript reads ViewData)
         ↓
Shows appropriate content divs
```

## Implementing Scoring Logic

Currently, `ScoringService.CalculatePerformanceTiers()` returns "high" for all sections as a placeholder.

To implement actual scoring:

1. Open `Services/ScoringService.cs`
2. Update the `CalculatePerformanceTiers` method
3. Map survey question IDs to sections
4. Calculate scores based on answers
5. Return appropriate tier ("high", "medium", or "low") for each section

### Example Scoring Implementation

```csharp
public PerformanceResults CalculatePerformanceTiers(Dictionary<string, string> surveyAnswers)
{
    var results = new PerformanceResults();

    // Example: Foundation score based on questions Q1-Q5
    var foundationScore = CalculateFoundationScore(surveyAnswers);
    results.Foundation = foundationScore >= 80 ? "high"
                       : foundationScore >= 60 ? "medium"
                       : "low";

    // Repeat for other sections...

    return results;
}

private int CalculateFoundationScore(Dictionary<string, string> answers)
{
    // Your scoring logic here
    // Example: average of Q1, Q2, Q3, Q4, Q5
    int total = 0;
    int count = 0;

    for (int i = 1; i <= 5; i++)
    {
        if (answers.TryGetValue($"Q{i}", out var value)
            && int.TryParse(value, out var score))
        {
            total += score;
            count++;
        }
    }

    return count > 0 ? total / count : 0;
}
```

## Testing

### Test Without Qualtrics
Simply visit: `http://localhost:5000/Results`

This will show default "high" performance for all sections without making any API calls.

### Test With Qualtrics Response ID
Visit: `http://localhost:5000/Results?response=R_XXXXXXXXXXXXX`

Replace `R_XXXXXXXXXXXXX` with an actual response ID from your Qualtrics survey.

## Security Considerations

1. **API Token Storage**
   - Development: Use User Secrets
   - Production: Use environment variables or Azure Key Vault
   - Never commit tokens to source control

2. **Response ID Validation**
   - The application validates that the response exists in Qualtrics
   - Invalid or missing response IDs fall back to default values

3. **Error Handling**
   - All errors are logged
   - User sees friendly error messages
   - Application gracefully falls back to defaults

## Troubleshooting

### Common Issues

1. **"Unable to retrieve survey data"**
   - Check API token is correct
   - Verify data center is "iad1"
   - Confirm survey ID is "SV_1zyYQ9I5tRHvNNc"
   - Check response ID is valid

2. **"An error occurred while processing your results"**
   - Check application logs for details
   - Verify Qualtrics API is accessible
   - Ensure survey response exists

3. **Build Errors**
   - Run `dotnet restore`
   - Check all service registrations in Program.cs

## Next Steps

1. Set your actual Qualtrics API token
2. Test with a real response ID
3. Implement actual scoring logic in `ScoringService`
4. Map survey questions to performance sections
5. Test with various response scenarios
