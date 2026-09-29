# NGX Insight Hub

Design and build the complete frontend UI for a PRIVATE, PERSONAL-USE Nigerian stock trading intelligence platform.

This application is NOT a public investment platform, brokerage, social-trading app, cryptocurrency platform, or robo-adviser.

There is only one primary user: me.

The platform's purpose is to help me monitor the Nigerian stock market, discover short-term trading opportunities, monitor stocks I already own, understand why the system is recommending an action, and receive clear BUY / BUY MORE / HOLD / WATCH / SELL / URGENT RISK signals.

The backend will eventually be built separately using Python + FastAPI.

Build the frontend so that it can later connect cleanly to REST APIs.

For now, use realistic MOCK DATA, but isolate all mock data so it can easily be replaced with API calls later.

Do not build fake backend logic into the frontend.

---

# PRODUCT OBJECTIVE

The platform analyses Nigerian Exchange stocks for trading opportunities with intended holding periods of approximately:

* 1 week
* 1 month
* 3 months

However, the expected holding period can change.

For example, a stock initially selected for a one-month trade may receive a SELL recommendation after 5 days if circumstances change.

The system continuously considers:

* stock price
* price movement
* volume
* momentum
* volatility
* technical indicators
* liquidity
* fundamentals
* valuation
* financial results
* dividends
* company news
* NGX disclosures
* Nigerian SEC announcements
* CBN announcements
* government policies
* industry/regulatory developments
* macroeconomic conditions
* documented management-related events
* operational disruptions
* risk

The frontend must communicate this clearly.

Do NOT portray the application's predictions as guaranteed.

Use language such as:

"Signal"

"Model confidence"

"Trading thesis"

"Current assessment"

"Risk"

"Supporting factors"

"Conditions changed"

Avoid language such as:

"Guaranteed profit"

"Guaranteed winner"

"Certain return"

---

# DESIGN DIRECTION

Create a sophisticated financial intelligence dashboard.

The interface should feel like a combination of:

* institutional investment dashboard
* modern fintech application
* professional market terminal
* research platform

But it must remain simple enough for a non-professional trader to understand.

Avoid:

* cryptocurrency-style aesthetics
* excessive neon colours
* flashy animations
* gambling-style UI
* confetti
* exaggerated profit visuals
* overly complex Wall Street terminal interfaces

The interface should feel:

* professional
* calm
* data-driven
* trustworthy
* modern
* premium
* readable
* information-dense without becoming overwhelming

Use a clean dashboard layout with excellent spacing and information hierarchy.

Use cards, charts, tables, badges, progress indicators, tooltips, drawers and modals appropriately.

Prefer subtle visual feedback rather than excessive animation.

---

# THEME

Support:

* Dark mode
* Light mode

Make dark mode especially polished because financial dashboards are often used for extended periods.

Use a neutral professional palette.

Suggested semantic colours:

Green:
positive / BUY / improving

Red:
negative / SELL / urgent risk

Amber:
WATCH / warning / uncertainty

Blue:
neutral information

Grey:
inactive / unavailable / secondary information

Do not rely on colour alone to communicate meaning.

Always combine colour with text, labels or icons.

---

# CURRENCY AND LOCALISATION

Use Nigerian Naira throughout.

Example:

₦2,450,000

Use Nigerian Exchange ticker examples such as:

GTCO

ZENITHBANK

ACCESSCORP

UBA

MTNN

AIRTELAFRI

DANGCEM

BUACEMENT

SEPLAT

PRESCO

OKOMUOIL

Use realistic-looking but clearly MOCK values.

Do not claim mock values are live market data.

---

# APP SHELL

Desktop layout:

Left sidebar navigation.

Top navigation/header.

Main content area.

Optional right-side contextual panel when useful.

Sidebar should be collapsible.

On mobile, use:

* bottom navigation for primary areas
* hamburger/drawer for secondary navigation

Primary navigation:

Dashboard

Market Scanner

Signals

Watchlist

Portfolio

Companies

Events & News

Macro

Backtests

Notifications

Data Sources

Settings

---

# GLOBAL HEADER

Include:

Current market status:

NGX Open

NGX Closed

or

Pre-market / After market

Show last market data refresh.

Example:

Market data updated 4 minutes ago

Include:

Global search

Notifications icon

Theme switcher

System/data health indicator

User/profile menu

Since this is a private single-user application, do not create organisation switching, team management, subscription or billing functionality.

---

# DASHBOARD

The Dashboard should immediately answer:

1. What do I currently own?
2. Is anything requiring my attention?
3. Are there any new opportunities?
4. Has anything important changed today?
5. How is my portfolio performing?

Create a top summary section showing:

Portfolio Value

Today's P/L

Total Unrealised P/L

Capital Invested

Available Capital

Open Positions

Active BUY Signals

Urgent Risk Alerts

Use attractive KPI cards.

Below this, create:

## URGENT ATTENTION

Only show this section when meaningful issues exist.

Examples:

GTCO — HOLD → SELL

Reason:
Negative regulatory development + momentum deterioration

SEPLAT — URGENT RISK

Reason:
Material industry disruption detected

Each alert should contain:

ticker

company name

previous state

current state

confidence

timestamp

short reason

View Analysis button

---

# CURRENT POSITIONS

Create a responsive portfolio table.

Columns:

Ticker

Company

Entry Price

Current Price

Quantity

Invested Amount

Current Value

P/L %

P/L ₦

Target Horizon

Current Signal

Confidence

Thesis Status

Last Updated

Example thesis statuses:

Strengthened

Intact

Weakened

Invalidated

Allow clicking a position to open the detailed stock page.

---

# MARKET OPPORTUNITIES

Create a section called:

Today's Opportunities

Provide horizon tabs:

1 Week

1 Month

3 Months

Each stock card should contain:

Ticker

Company

Sector

Current price

Daily change

Signal

Overall score

Confidence

Liquidity rating

Risk rating

Short explanation

Example:

PRESCO

BUY

1-Month Opportunity

Model Confidence: 81%

Why:

Strong momentum

High relative volume

Strong fundamentals

Positive sector conditions

Risks:

Valuation becoming expensive

Button:

View Full Analysis

---

# MARKET SCANNER PAGE

This is one of the most important pages.

Create a professional stock scanner.

Top section:

Last scan time

Number of NGX stocks analysed

Number excluded due to insufficient data

Number excluded due to low liquidity

Number currently on WATCH

Number with BUY signals

Number with SELL/risk signals

Provide horizon tabs:

1 Week

1 Month

3 Months

Provide filters:

Signal

Sector

Liquidity

Risk

Confidence

Price range

Market capitalisation if available

Minimum trading volume

Fundamental quality

Event risk

Search by ticker/company

Scanner table columns:

Rank

Ticker

Company

Sector

Price

Daily %

Signal

Overall Score

Technical

Fundamentals

Liquidity

Events

Macro

Risk

Confidence

Last Updated

Allow sorting.

Use expandable rows showing:

Supporting factors

Risk factors

Recent events

Data warnings

---

# SIGNALS PAGE

Create a page focused purely on signal history.

Filters:

BUY

BUY MORE

HOLD

WATCH

SELL

URGENT RISK

1 Week

1 Month

3 Months

Today

7 Days

30 Days

Signal cards/table should show:

ticker

company

old state

new state

horizon

confidence

score

timestamp

reason

notification status

Example:

GTCO

HOLD → SELL

1 Month

Confidence 84%

Reason:

Momentum deterioration

Negative regulatory development

Price approaching downside risk threshold

---

# WATCHLIST

Allow the user to maintain a personal watchlist.

Table/cards:

Ticker

Price

Daily change

1-week signal

1-month signal

3-month signal

Confidence

Latest material event

Last checked

Allow:

Add to watchlist

Remove

Open stock details

Mark as purchased

---

# STOCK DETAIL PAGE

This should be one of the richest pages.

Header:

GTCO

Guaranty Trust Holding Company Plc

Sector

Ticker

Current Price

Daily Change

Last Updated

Current Holding Status if owned

---

## PRICE CHART

Use an interactive candlestick or line chart.

Time ranges:

5D

1M

3M

6M

1Y

5Y

Allow technical overlays such as:

SMA 20

SMA 50

EMA

Volume

RSI

MACD

Do not overload the initial chart.

---

# SIGNAL SUMMARY

Show the three horizons side-by-side.

Example:

1 WEEK

WATCH

Score: 68

Confidence: 70%

---

1 MONTH

BUY

Score: 83

Confidence: 81%

---

3 MONTHS

BUY

Score: 79

Confidence: 76%

Each should have:

View explanation

---

# WHY THIS SIGNAL?

Create an explainable signal panel.

Example:

Overall Score

83 / 100

Component breakdown:

Technical: 87

Fundamentals: 85

Liquidity: 91

News / Events: 78

Macro: 72

Risk: 74

Use bars/radar chart or another readable visualization.

Below:

Supporting Factors

* Strong upward momentum
* Above-average trading volume
* Earnings growth improving
* Good market liquidity
* No major negative regulatory developments

Risk Factors

* Banking sector sensitive to monetary policy
* Stock approaching historical resistance
* Upcoming earnings announcement

---

# TRADING THESIS

Create a dedicated panel:

Current Thesis:

"The stock currently has positive momentum supported by strong volume and fundamentals. The 1-month horizon currently provides the strongest setup."

Include:

Thesis status

Created date

Last changed date

Initial score

Current score

Major changes since original signal

---

# TECHNICAL ANALYSIS TAB

Show:

Trend

Momentum

RSI

MACD

ATR

Volatility

Moving averages

Relative volume

Support/resistance where available

Drawdown

52-week positioning

Each metric should have a tooltip explaining it simply.

---

# FUNDAMENTALS TAB

Show:

Revenue

Revenue Growth

Profit Before Tax

Profit After Tax

EPS

EPS Growth

ROE

ROA

Profit Margin

Debt

Cash

Operating Cash Flow

Dividend

Dividend Yield

P/E

P/B

Use:

latest period

previous period

change %

Historical charts where useful

Show source and reporting date.

---

# LIQUIDITY TAB

Show:

Average Daily Volume

Average Daily Value

Trading Frequency

Zero-volume days

Volume consistency

Position-size liquidity assessment

Overall Liquidity:

High / Medium / Low

Explain why liquidity matters when selling a position.

---

# NEWS & EVENTS TAB

Timeline format.

Examples:

Quarterly Results Released

Dividend Announcement

CBN Policy Decision

SEC Circular

Government Policy

CEO/Board Change

Industry Disruption

Regulatory Action

Each event should show:

date

source

event category

severity

estimated impact

confidence

affected horizon

short summary

View Original Source

Clearly distinguish:

OFFICIAL SOURCE

REPUTABLE MEDIA

OTHER SOURCE

---

# PORTFOLIO PAGE

Header:

Portfolio Value

Invested Capital

Unrealised Profit/Loss

Realised Profit/Loss

Cash Available

Create allocation visualization by:

stock

sector

signal state

Portfolio table should show all positions.

Include:

Add Position button

When adding a position ask:

Ticker

Quantity

Entry Price

Purchase Date

Target Horizon

Notes

No brokerage/order execution should happen.

This simply records a trade made externally.

---

# POSITION DETAIL

When a portfolio position is opened, show:

Entry information

Current market information

P/L

Current signal

Original signal

Original thesis

Current thesis

Target horizon

Days held

Thesis status

Signal history

Relevant events since purchase

Important risk changes

Create a timeline:

Purchased

HOLD

BUY MORE

HOLD

SELL

Show exactly why each transition occurred.

---

# EVENTS & NEWS PAGE

Create a central intelligence feed.

Tabs:

All

Company

NGX

SEC

CBN

Government

Industry

Macroeconomic

Management

Filters:

Company

Sector

Source

Severity

Impact

Date

Show each event as a professional intelligence card.

Example:

HIGH IMPACT

CBN Monetary Policy Decision

Affected sectors:
Banking, Consumer Goods

Impact:
Mixed / Negative

Confidence:
High

Published:
...

Source:
Central Bank of Nigeria

Companies potentially affected:
GTCO
ZENITHBANK
ACCESSCORP
UBA

Allow opening a detailed event view.

---

# EVENT DETAIL

Show:

Title

Source

Published date

Retrieved date

Source confidence

Event classification

Severity

Impact direction

Affected companies

Affected sectors

Time horizon

AI/analysis summary if available

Original source link

Raw/source document reference

Explain:

"How this affects my portfolio"

if relevant positions exist.

---

# MACRO PAGE

Create a Nigerian macroeconomic dashboard.

Cards:

Inflation

Monetary Policy Rate

USD/NGN

External Reserves

Treasury Bill Yield

GDP Growth

Other relevant metrics

Show:

latest value

previous value

change

publication date

source

Use time-series charts.

Create a section:

Current Macro Environment

Example:

Overall:

RESTRICTIVE

Factors:

High interest rates

Elevated inflation

Currency pressure

Then show:

Sector Sensitivity

Banking

Telecom

Consumer Goods

Industrial Goods

Oil & Gas

Agriculture

Do not oversimplify macroeconomic relationships.

---

# BACKTESTS PAGE

Create a professional strategy-testing interface.

Show historical strategy versions.

For each backtest:

Strategy Version

Date Range

Initial Capital

Final Capital

Total Return

Number of Trades

Win Rate

Average Win

Average Loss

Profit Factor

Maximum Drawdown

Average Holding Period

Show equity curve.

Show drawdown chart.

Show results by:

year

sector

holding horizon

Provide trade history table.

Make it clear:

Past performance does not guarantee future results.

---

# NOTIFICATIONS PAGE

Show notification history.

Filters:

BUY

BUY MORE

SELL

URGENT

Email

Push

Delivery status

Each record should show:

Ticker

Action

Reason

Timestamp

Channel

Delivery status

Allow notification preferences:

Push

Email

Both

Quiet hours

Urgent alerts bypass quiet hours toggle

---

# DATA SOURCES PAGE

This is important because the application must be transparent about where its information comes from.

Show source cards.

Examples:

NGX Market Data

NGX Disclosures

SEC Nigeria

CBN

NBS

Company Investor Relations

News Provider

For each source show:

Status

Last successful sync

Last attempted sync

Freshness

Source confidence

Collection method

Examples:

API

RSS

HTML monitoring

PDF

CSV

Excel

Allow opening source history.

Create clear indicators:

Healthy

Delayed

Unavailable

Error

Stale

---

# DATA QUALITY

Create a global way to communicate data quality.

Examples:

Complete

Partial

Stale

Unavailable

Conflicting

A trading signal should display a warning if important inputs are missing.

Example:

DATA QUALITY WARNING

This signal has reduced confidence because today's volume data is unavailable.

---

# SYSTEM HEALTH

Create a subtle system-health page or panel.

Show:

API backend

Database

Redis

Background workers

Market data collector

News collector

NGX disclosure collector

SEC collector

CBN collector

OneSignal

Brevo

Show:

Healthy

Degraded

Unavailable

Last check

---

# SETTINGS

Sections:

Trading Preferences

Default Horizons

Risk Settings

Notification Settings

Data Sources

Market Scan Frequency

Interface Preferences

Do not expose API secrets directly.

Use masked credential states such as:

Brevo:
Configured

OneSignal:
Configured

NGX:
Not configured

---

# MOBILE EXPERIENCE

The mobile version is extremely important because push notifications will lead me into the application from my phone.

Mobile dashboard should prioritise:

Urgent Alerts

Portfolio

Current Positions

New BUY Signals

SELL Signals

Recent Events

Keep financial tables horizontally scrollable where appropriate.

Use cards when tables become unreadable.

Create bottom navigation:

Home

Scanner

Portfolio

Signals

More

---

# PUSH NOTIFICATION DEEP LINKS

Design the application so a notification such as:

"GTCO: HOLD → SELL"

can open directly into:

/stocks/GTCO

and automatically highlight:

the SELL signal

the reason

the event that triggered it

---

# COMPONENT SYSTEM

Create reusable components such as:

SignalBadge

ConfidenceBadge

RiskBadge

LiquidityBadge

DataQualityBadge

SourceBadge

PriceChange

MetricCard

StockCard

PositionCard

EventCard

SignalExplanation

SourceReference

MarketStatus

ScoreBreakdown

EmptyState

LoadingState

ErrorState

StaleDataWarning

---

# SIGNAL COLOURS

Use consistent semantics.

BUY:
green

BUY MORE:
strong green

HOLD:
blue

WATCH:
amber

SELL:
red

URGENT RISK:
strong red

Always include text, never colour only.

---

# LOADING / ERROR / EMPTY STATES

Do not leave these as an afterthought.

Design proper:

skeleton loaders

empty states

API error messages

offline states

stale-data states

partial-data warnings

Example:

"Market data is temporarily unavailable. Last successful update was 26 minutes ago."

---

# API ARCHITECTURE PREPARATION

Although no live backend exists yet, structure frontend data access through a dedicated API/service layer.

Do not scatter mock data through components.

Create a structure conceptually similar to:

services/

market.ts

signals.ts

portfolio.ts

companies.ts

events.ts

macro.ts

notifications.ts

backtests.ts

sources.ts

For now these may use local mock fixtures.

Make replacement with FastAPI straightforward later.

---

# EXPECTED FUTURE BACKEND

The frontend will eventually communicate with a Python FastAPI backend.

Assume REST endpoints will exist for:

companies

securities

market data

price history

signals

market scanner

portfolio

positions

events

news

macroeconomic indicators

backtests

notifications

data sources

system health

Do not use Supabase as the core backend.

Do not implement business-critical trading logic in the frontend.

The backend will be responsible for all calculations and signals.

The UI only displays the results.

---

# AUTHENTICATION

This is a private single-user platform.

Create a simple professional login screen.

No:

public registration

social profiles

referrals

subscription

billing

team members

organisation management

marketplace

community

Use a simple private login interface.

---

# IMPORTANT DISCLAIMER UX

Do not constantly annoy the user with disclaimers.

However, in appropriate locations such as signal explanations and backtest pages, include subtle wording such as:

"Signals represent model-based analysis and are not guarantees of future market performance."

---

# DESIGN PRIORITY

Prioritise the following pages first:

1. Dashboard
2. Market Scanner
3. Stock Detail
4. Portfolio
5. Signals
6. Events & News
7. Macro
8. Backtests
9. Notifications
10. Data Sources
11. Settings

All pages should share the same design system.

---

# FINAL GOAL

The finished interface should allow me to open the platform and answer within seconds:

"What stocks currently look interesting?"

"What should I be watching?"

"Do I need to sell anything I currently own?"

"Has something changed since I bought this stock?"

"Why is the system recommending this action?"

"What news/regulatory event affected this stock?"

"How confident is the analysis?"

"Is the underlying data fresh and trustworthy?"

Do not make the application look like a generic admin dashboard.

It should feel purpose-built for Nigerian stock-market intelligence and short-term trading.

Build the UI with polished realistic mock data and ensure all screens are connected through navigation and meaningful interactions.

## Development

This dashboard lives in the `dashboard/` folder of the backend repository. Every page reads the
FastAPI API; see the repository README for starting the backend.

You need Node.js and npm.

```sh
cd dashboard
npm install
cp .env.example .env.local   # VITE_API_URL: the API base URL
npm run dev                  # http://127.0.0.1:8080
```

Add the dashboard's origin to the API's `CORS_ORIGINS`. Check types with `npx tsc --noEmit`, and
build with `npm run build`.

Production is hosted on Vercel (root directory `dashboard`, `VITE_API_URL` set in the Vercel
project). The steps are in `docs/deployment.md`, "Dashboard (Vercel)".
