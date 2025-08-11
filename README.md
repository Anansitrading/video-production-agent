# AI-Powered Video Production Agent with Glassmorphism Design

🎬 **A sophisticated web application that creates videos from creative briefs using Gemini, Imagen, and Veo3 APIs. Features real-time chat, storyboard generation, and seamless video production pipeline.**

## 🌟 Features

### Core Functionality
- **AI-Powered Video Creation**: Transform creative briefs into complete videos using Google's latest AI models
- **Storyboard Generation**: Automated visual storyboard creation with Imagen AI  
- **Real-time Chat Interface**: Interactive chat for iterative video refinement
- **Video Pipeline Orchestration**: Seamless integration of multiple AI services

### Technical Highlights
- **Modern React TypeScript Frontend**: Built with Vite, Tailwind CSS, and shadcn/ui components
- **Glassmorphism Design System**: Beautiful, modern UI with glassmorphism effects
- **Supabase Backend**: Real-time database, authentication, and edge functions
- **AI Integration**: Gemini, Imagen, and Veo3 API integration
- **Responsive Design**: Mobile-first, fully responsive interface

## 🏗️ Architecture

### Frontend (`src/`)
- **React 18** with TypeScript for robust component development
- **Vite** for fast development and optimized production builds
- **Tailwind CSS** for utility-first styling approach
- **shadcn/ui** for high-quality, accessible components
- **Custom glassmorphism components** for modern, elegant UI

### Backend (`supabase/`)
- **Supabase Database**: PostgreSQL with real-time subscriptions
- **Edge Functions**: Serverless functions for AI API integration
- **Authentication**: Built-in auth with multiple provider support
- **File Storage**: Secure storage for media assets and generated content

### Design System (`design-system/`)
- **Glassmorphism Theme**: CSS variables and utility classes
- **Component Library**: Reusable glassmorphism components
- **Background Gradients**: Beautiful animated background effects

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm package manager
- Supabase account and project
- Google Cloud Platform account (for AI APIs)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/Anansitrading/video-production-agent.git
   cd video-production-agent
   pnpm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Set up Supabase**:
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Initialize and link to your project  
   supabase init
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Deploy database schema
   supabase db push
   
   # Deploy edge functions
   supabase functions deploy
   ```

4. **Start development server**:
   ```bash
   pnpm dev
   ```

## 🔧 Configuration

### Required API Keys
- **Supabase**: Project URL and anon key from your Supabase dashboard
- **Google Cloud**: API key with Gemini, Imagen, and Veo3 access
- **Optional**: Additional AI service keys for enhanced functionality

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## 📁 Project Structure

```
video-production-agent/
├── src/                          # React TypeScript frontend
│   ├── components/              # React components for UI
│   ├── contexts/               # React contexts for state management
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries and helpers
│   └── glassmorphism/          # Glassmorphism styling system
├── supabase/                    # Backend configuration
│   ├── functions/              # Edge functions for AI integration
│   └── tables/                 # Database schema definitions
├── design-system/               # Standalone design system files
├── docs/                       # Project documentation
└── public/                     # Static assets and files
```

## 🎨 Design System

The project features a comprehensive glassmorphism design system with:

- **Glassmorphism Components**: Backdrop blur effects, transparency, and subtle shadows
- **Dynamic Gradients**: Smooth, animated background gradients
- **Responsive Design**: Mobile-first approach with flexible breakpoint utilities
- **Accessibility**: WCAG compliant with proper contrast ratios and focus states
- **CSS Custom Properties**: Theming system with CSS variables
- **Component Variants**: Multiple style variations for different use cases

## 🔄 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
pnpm build
# Deploy the dist/ folder to your preferred hosting platform
```

### Backend Deployment (Supabase)
```bash
# Deploy all functions
supabase functions deploy

# Deploy database changes
supabase db push

# Set up environment variables in Supabase dashboard
```

## 🧪 Development

### Available Scripts
- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Create production build
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Run ESLint for code quality
- `pnpm type-check` - Run TypeScript type checking

### Code Quality Tools
- **TypeScript**: Full type safety across the codebase
- **ESLint**: Linting with React hooks and accessibility rules
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for quality gates and automated checks

## 📚 API Documentation

### Core API Endpoints
- **Creative Brief Generation**: `POST /api/creative-brief` - Generate creative briefs from prompts
- **Storyboard Generation**: `POST /api/storyboard` - Create visual storyboards
- **Video Processing**: `POST /api/video-pipeline` - Process video generation pipeline
- **Chat Interface**: WebSocket connections for real-time communication

### Database Schema
- **video_projects**: Main project records and metadata
- **storyboard_frames**: Individual storyboard frame data
- **chat_sessions**: Chat conversation history and context
- **video_clips**: Generated video segment information
- **playbooks**: Template and workflow definitions

## 🤝 Contributing

We welcome contributions from the community! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper commit messages
4. Push to your branch: `git push origin feature/amazing-feature`  
5. Open a Pull Request with detailed description

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Maintain consistent code style with Prettier
- Update documentation for API changes
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for complete terms and conditions.

## 🙏 Acknowledgments

Special thanks to the amazing open-source community and these key technologies:

- **Google AI**: For providing cutting-edge AI models (Gemini, Imagen, Veo3)
- **Supabase**: For the excellent backend-as-a-service platform
- **React Team**: For the incredible React framework and ecosystem
- **Tailwind CSS**: For the utility-first CSS framework
- **shadcn/ui**: For the beautiful, accessible component library
- **Vite**: For the lightning-fast build tool and development experience

## 🔗 Links

- [Live Demo](https://video-production-agent.vercel.app) *(Coming Soon)*
- [Documentation](https://github.com/Anansitrading/video-production-agent/wiki)
- [Issues & Bug Reports](https://github.com/Anansitrading/video-production-agent/issues)
- [Feature Requests](https://github.com/Anansitrading/video-production-agent/discussions)
- [Project Roadmap](https://github.com/Anansitrading/video-production-agent/projects)

## 📈 Project Status

This project is actively maintained and under continuous development. Key features are production-ready, with ongoing enhancements for AI model integration and user experience improvements.

---

**Built with ❤️ using React, TypeScript, Supabase, and Google AI**

*Creating the future of AI-powered video production, one frame at a time.*
