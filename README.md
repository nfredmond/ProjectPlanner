# RTPA Project Prioritization Platform v0.2.0

A comprehensive web application for Regional Transportation Planning Agencies (RTPAs) to manage, analyze, and prioritize transportation projects. This platform integrates advanced tools like Large Language Models (LLMs) for intelligent assistance, robust GIS mapping for spatial analysis, and data-driven scoring methodologies aligned with California and federal guidelines.

## 📋 Deployment Documentation for Non-Technical Users

**Are you an RTPA employee looking to deploy this application?** We've created comprehensive guides to help you:

- [**SETUP_INSTRUCTIONS.txt**](./SETUP_INSTRUCTIONS.txt) - Detailed step-by-step instructions for deploying the platform
- [**QUICKSTART.txt**](./QUICKSTART.txt) - Condensed guide with essential setup steps
- [**TROUBLESHOOTING.txt**](./TROUBLESHOOTING.txt) - Solutions for common issues you might encounter

These guides are specifically designed for users with minimal coding experience.

## Features

### LLM-Powered Assistance
- **Grant & Funding Support**: Evaluate projects against grant criteria using LLM-based analysis
- **Project Recommendations**: Get suggestions for project improvements based on scores
- **Automated Reporting & Summaries**: Generate comprehensive reports with a single click
- **Community Input Responses**: Draft responses to public comments automatically

### GIS and Mapping Integration
- **Interactive Mapping**: View and manage projects on an interactive map
- **Project Layers**: Add markers or draw polygons/polylines for project extents
- **Multiple Basemap Options**: Choose from different mapping providers (OpenStreetMap, Mapbox, etc.)
- **User-Friendly GIS Tools**: Add projects by dropping pins or drawing on the map

### Project Scoring and Prioritization
- **Standards-Based Scoring**: Default scoring model reflecting California Transportation Commission and federal guidelines
- **Customizable Methodologies**: Add or remove criteria and adjust weights through an admin UI
- **ML-Enhanced Prioritization**: Machine learning model to refine priorities based on historical project outcomes

### Community Engagement Tools
- **Public Input Portal**: Allow community members to participate in the planning process
- **Interactive Maps for Feedback**: Let users drop pins or highlight locations for feedback
- **Image Uploads and Media**: Support for uploading images to complement feedback
- **Sentiment Analysis**: Quickly gauge public opinion on projects

### External API Integrations
- **Caltrans & State Data**: Integration with Caltrans APIs and data feeds
- **Census API**: Fetch demographic data for project areas
- **California Transportation Commission (CTC)**: Access to STIP and ATP information

### Reporting and Dashboard
- **Interactive Dashboard**: Visualize project portfolio and scoring outcomes
- **LLM-Generated Reports**: Automatically generate draft reports for various purposes
- **Customizable Templates**: Maintain report templates for different needs
- **Geospatial Reports**: Include maps and visualizations in reports

## Technical Stack

- **Frontend**: Next.js (React) with TypeScript
- **Backend**: Node.js (Next.js API routes)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Mapping**: Leaflet.js with optional Mapbox integration
- **LLM Integration**: OpenAI (o3-mini recommended) and Anthropic Claude (Claude 3.7 Sonnet recommended)
- **Styling**: Tailwind CSS

## Getting Started (For Developers)

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key (or Anthropic API key)
- Mapbox access token (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/rtpa-project-prioritization.git
   cd rtpa-project-prioritization
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in the required values:
     - Supabase URL and keys
     - OpenAI API key (o3-mini model recommended) or Anthropic API key (Claude 3.7 Sonnet recommended)
     - Mapbox access token (if using)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

The application uses Supabase for database, authentication, and storage. The initial schema is defined in `supabase/migrations/00001_initial_schema.sql`.

To set up the database:

1. Create a new Supabase project
2. Run the migration script in the Supabase SQL editor
3. Enable the PostGIS extension for geospatial features
4. Configure Row-Level Security (RLS) policies as defined in the migration script

## Usage

### User Roles

- **Admin**: Can manage users, settings, and all projects
- **Editor**: Can create and edit projects, run analyses
- **Viewer**: Read-only access to dashboards and projects
- **Community**: For public users with restricted access

### Project Management

1. **Creating Projects**: Navigate to Projects > New Project
   - Fill in project details
   - Add location on the map
   - Upload supporting documents

2. **Scoring Projects**: Go to Prioritization
   - Select criteria to use
   - Enter scores for each criterion
   - View overall project ranking

3. **Generating Reports**: Go to Reports
   - Select projects to include
   - Choose report type
   - Generate and download the report

### Community Engagement

1. **Public Portal**: Access the Community section
   - View proposed projects
   - Submit feedback on specific projects
   - Take surveys created by the agency

2. **Map Feedback**: Use the interactive map
   - Drop pins at locations of concern
   - Draw areas for suggested improvements
   - Upload photos of issues

## Configuration

### LLM Settings

Configure LLM providers in the Admin > Settings panel:
- Select preferred provider (OpenAI or Anthropic)
  - For OpenAI, we recommend using the o3-mini model for its excellent balance of performance and cost
  - For Anthropic, we recommend using Claude 3.7 Sonnet for optimal results
- Set API keys
- Adjust prompt templates

### Scoring Criteria

Customize scoring methodology in Admin > Scoring:
- Add/remove criteria
- Adjust weights
- Define scoring formulas

### Map Configuration

Set up mapping options in Admin > Map Settings:
- Default map center and zoom
- Base layer selection
- Custom overlay layers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Before contributing, please review our [Branching Strategy](./BRANCHING_STRATEGY.md) document, which outlines our workflow for feature development, releases, and maintaining the portable app version.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- California Transportation Commission for scoring guidelines
- U.S. Census Bureau for demographic data API
- OpenAI and Anthropic for LLM capabilities 