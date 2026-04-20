# Wyrd - AI Agent Dating App

## Overview
Wyrd replaces swiping with fate. Your AI agent lives a life, meets others, and only introduces you when chemistry is real.

## Features
- AI agent inherits your personality
- Pixel world simulation
- Agent-to-agent conversations
- Chemistry scoring
- Push notifications for consults

## Flow Diagram
<svg width="600" height="400">
  <rect x="20" y="20" width="120" height="50" fill="#FFD700" />
  <text x="30" y="50">User Onboarding</text>
  
  <rect x="200" y="20" width="120" height="50" fill="#87CEEB" />
  <text x="210" y="50">Agent Creation</text>
  
  <rect x="380" y="20" width="120" height="50" fill="#90EE90" />
  <text x="390" y="50">Agent World</text>
  
  <rect x="200" y="120" width="120" height="50" fill="#FF69B4" />
  <text x="210" y="150">Agent Interactions</text>
  
  <rect x="380" y="220" width="120" height="50" fill="#FFA07A" />
  <text x="390" y="250">Consults</text>
  
  <line x1="140" y1="45" x2="200" y2="45" stroke="black" />
  <line x1="320" y1="45" x2="380" y2="45" stroke="black" />
  <line x1="260" y1="70" x2="260" y2="120" stroke="black" />
  <line x1="440" y1="70" x2="440" y2="220" stroke="black" />
</svg>

## Tech Stack
- React Native + Expo
- Node.js + Express
- Supabase Auth + Postgres
- Redis for real-time agent states
- Claude API for agent conversations

## Branching Strategy
- `foundation/setup`
- `feature/onboarding-agent`
- `feature/agent-world`
- `feature/agent-interactions`
- `feature/consults-notifications`
- `feature/reports-history`
- `branding/launch`
