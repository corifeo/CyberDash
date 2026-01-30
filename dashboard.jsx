import { useState, useRef, useEffect } from 'react';
import { Info, ArrowLeft, Home, CheckCircle, XCircle, Circle, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import * as d3 from 'd3';

const PerfectGridTreemap = () => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Expanded security practices (10 capabilities)
  const securityPractices = {
    embeddedSecurityExperts: {
      name: "Embedded Security Experts",
      description: "Security champions within development teams",
      type: "boolean"
    },
    threatModeling: {
      name: "Threat Modeling",
      description: "Systematic threat analysis during design phase",
      type: "maturity"
    },
    secureCodeReview: {
      name: "Secure Code Review",
      description: "Security-focused peer review process",
      type: "boolean"
    },
    automatedSecurityTesting: {
      name: "Automated Security Testing",
      description: "SAST/DAST integrated in CI/CD pipeline",
      type: "maturity"
    },
    dependencyScanning: {
      name: "Dependency Vulnerability Scanning",
      description: "Automated scanning of third-party components",
      type: "maturity"
    },
    secretsManagement: {
      name: "Secrets Management",
      description: "Secure handling of credentials and sensitive data",
      type: "maturity"
    },
    securityRequirements: {
      name: "Security Requirements Management",
      description: "Defined and tracked security requirements in SDLC",
      type: "maturity"
    },
    vulnerabilityManagement: {
      name: "Vulnerability Management",
      description: "Systematic vulnerability remediation process",
      type: "maturity"
    },
    incidentResponse: {
      name: "Security Incident Response",
      description: "Defined security incident procedures",
      type: "boolean"
    },
    securityTesting: {
      name: "Security Testing Strategy",
      description: "Comprehensive security testing approach",
      type: "maturity"
    }
  };

  // Current reporting period
  const currentPeriod = "January 2025";

  // Data structure with expanded practices assessment
  const organizationData = {
    name: "Security Practices Status Update",
    reportingPeriod: currentPeriod,
    children: [
      {
        id: "digital-data-oversight",
        name: "Digital & Data Oversight",
        squadCount: 3,
        children: [
          {
            id: "data-governance-squad",
            name: "Data Governance Squad",
            practices: {
              embeddedSecurityExperts: true,
              threatModeling: 3,
              secureCodeReview: true,
              automatedSecurityTesting: 4,
              dependencyScanning: 4,
              secretsManagement: 3,
              securityRequirements: 4,
              vulnerabilityManagement: 4,
              incidentResponse: true,
              securityTesting: 3
            },
            monthlyUpdate: {
              currentPeriod: "Enhanced threat modeling for new data classification system",
              nextPeriod: "Implementing automated privacy impact assessments",
              trend: "stable",
              keyMetric: "100% compliance reviews completed on time"
            }
          },
          {
            id: "privacy-compliance-team", 
            name: "Privacy & Compliance",
            practices: {
              embeddedSecurityExperts: true,
              threatModeling: 3,
              secureCodeReview: true,
              automatedSecurityTesting: 3,
              dependencyScanning: 3,
              secretsManagement: 4,
              securityRequirements: 3,
              vulnerabilityManagement: 3,
              incidentResponse: true,
              securityTesting: 3
            },
            monthlyUpdate: {
              currentPeriod: "Integrating security testing into CI/CD pipeline",
              nextPeriod: "Expanding threat modeling to legacy systems",
              trend: "improving",
              keyMetric: "Zero compliance violations for 6 months"
            }
          },
          {
            id: "risk-management",
            name: "Risk Management",
            practices: {
              embeddedSecurityExperts: false,
              threatModeling: 2,
              secureCodeReview: true,
              automatedSecurityTesting: 2,
              dependencyScanning: 2,
              secretsManagement: 2,
              securityRequirements: 3,
              vulnerabilityManagement: 3,
              incidentResponse: false,
              securityTesting: 2
            },
            monthlyUpdate: {
              currentPeriod: "Recruiting security champion and defining incident response",
              nextPeriod: "Security champion onboarding and IR plan implementation",
              trend: "improving",
              keyMetric: "Risk register now covers 85% of systems"
            }
          }
        ]
      },
      {
        id: "digital-platforms",
        name: "Digital Platforms & Services", 
        squadCount: 4,
        children: [
          {
            id: "api-gateway-squad",
            name: "API Gateway Squad",
            practices: {
              embeddedSecurityExperts: false,
              threatModeling: 2,
              secureCodeReview: true,
              automatedSecurityTesting: 3,
              dependencyScanning: 3,
              secretsManagement: 2,
              securityRequirements: 2,
              vulnerabilityManagement: 2,
              incidentResponse: true,
              securityTesting: 2
            },
            monthlyUpdate: {
              currentPeriod: "Enhancing OAuth implementation and security testing",
              nextPeriod: "Security champion identification and threat modeling training",
              trend: "improving",
              keyMetric: "API security issues reduced by 40%"
            }
          },
          {
            id: "cloud-infrastructure",
            name: "Cloud Infrastructure",
            practices: {
              embeddedSecurityExperts: false,
              threatModeling: 1,
              secureCodeReview: false,
              automatedSecurityTesting: 2,
              dependencyScanning: 1,
              secretsManagement: 1,
              securityRequirements: 1,
              vulnerabilityManagement: 1,
              incidentResponse: false,
              securityTesting: 1
            },
            monthlyUpdate: {
              currentPeriod: "Establishing security baseline and champion recruitment",
              nextPeriod: "Security champion onboarding and baseline implementation",
              trend: "declining",
              keyMetric: "Cloud security posture assessment: 35% compliance"
            }
          },
          {
            id: "identity-platform",
            name: "Identity Platform", 
            practices: {
              embeddedSecurityExperts: true,
              threatModeling: 4,
              secureCodeReview: true,
              automatedSecurityTesting: 4,
              dependencyScanning: 3,
              secretsManagement: 4,
              securityRequirements: 3,
              vulnerabilityManagement: 3,
              incidentResponse: true,
              securityTesting: 4
            },
            monthlyUpdate: {
              currentPeriod: "Advanced MFA implementation and security automation",
              nextPeriod: "Identity governance framework expansion",
              trend: "stable",
              keyMetric: "99.9% authentication availability, zero security incidents"
            }
          },
          {
            id: "messaging-services",
            name: "Messaging Services",
            practices: {
              embeddedSecurityExperts: false,
              threatModeling: 2,
              secureCodeReview: true,
              automatedSecurityTesting: 2,
              dependencyScanning: 2,
              secretsManagement: 3,
              securityRequirements: 2,
              vulnerabilityManagement: 2,
              incidentResponse: true,
              securityTesting: 2
            },
            monthlyUpdate: {
              currentPeriod: "Expanding security testing and vulnerability management",
              nextPeriod: "Security champion training and threat modeling workshops",
              trend: "improving",
              keyMetric: "Message security coverage increased to 80%"
            }
          }
        ]
      },
      {
        id: "digital-product-eng",
        name: "Digital Product Engineering",
        squadCount: 4,
        children: [
          {
            id: "mobile-app-squad",
            name: "Mobile App Squad",
            practices: {
              embeddedSecurityExperts: false,
              threatModeling: 1,
              secureCodeReview: false,
              automatedSecurityTesting: 1,
              dependencyScanning: 1,
              secretsManagement: 1,
              securityRequirements: 1,
              vulnerabilityManagement: 1,
              incidentResponse: false,
              securityTesting: 1
            },
            monthlyUpdate: {
              currentPeriod: "Beginning security assessment and champion identification",
              nextPeriod: "Security champion recruitment and basic training program",
              trend: "declining",
              keyMetric: "Mobile security framework implementation: 20%"
            }
          },
          {
            id: "web-frontend-team",
            name: "Web Frontend",
            practices: {
              embeddedSecurityExperts: true,
              threatModeling: 2,
              secureCodeReview: true,
              automatedSecurityTesting: 2,
              dependencyScanning: 3,
              secretsManagement: 2,
              securityRequirements: 2,
              vulnerabilityManagement: 2,
              incidentResponse: false,
              securityTesting: 2
            },
            monthlyUpdate: {
              currentPeriod: "Implementing CSP and expanding security testing",
              nextPeriod: "Incident response plan and threat modeling training",
              trend: "improving",
              keyMetric: "XSS vulnerabilities reduced by 60%"
            }
          },
          {
            id: "payment-systems",
            name: "Payment Systems",
            practices: {
              embeddedSecurityExperts: false,
              threatModeling: 1,
              secureCodeReview: false,
              automatedSecurityTesting: 1,
              dependencyScanning: 1,
              secretsManagement: 2,
              securityRequirements: 2,
              vulnerabilityManagement: 1,
              incidentResponse: false,
              securityTesting: 1
            },
            monthlyUpdate: {
              currentPeriod: "Urgent security remediation in progress",
              nextPeriod: "Dedicated security champion assignment and intensive support",
              trend: "declining",
              keyMetric: "Critical security items: 12 open (high priority)"
            }
          },
          {
            id: "customer-portal",
            name: "Customer Portal",
            practices: {
              embeddedSecurityExperts: true,
              threatModeling: 2,
              secureCodeReview: true,
              automatedSecurityTesting: 3,
              dependencyScanning: 2,
              secretsManagement: 3,
              securityRequirements: 2,
              vulnerabilityManagement: 2,
              incidentResponse: true,
              securityTesting: 3
            },
            monthlyUpdate: {
              currentPeriod: "Enhancing automated testing and access controls",
              nextPeriod: "Advanced threat modeling and security automation",
              trend: "improving",
              keyMetric: "Customer data protection: 95% compliance"
            }
          }
        ]
      },
      {
        id: "digital-business-opt",
        name: "Digital Business Optimisation",
        squadCount: 3,
        children: [
          {
            id: "analytics-platform",
            name: "Analytics Platform",
            practices: {
              embeddedSecurityExperts: true,
              threatModeling: 3,
              secureCodeReview: true,
              automatedSecurityTesting: 3,
              dependencyScanning: 3,
              secretsManagement: 4,
              securityRequirements: 3,
              vulnerabilityManagement: 4,
              incidentResponse: true,
              securityTesting: 3
            },
            monthlyUpdate: {
              currentPeriod: "Advanced analytics security and privacy controls",
              nextPeriod: "Machine learning security and data lineage enhancement",
              trend: "stable",
              keyMetric: "Data governance: 100% of analytics datasets classified"
            }
          },
          {
            id: "data-warehouse-squad",
            name: "Data Warehouse",
            practices: {
              embeddedSecurityExperts: false,
              threatModeling: 2,
              secureCodeReview: true,
              automatedSecurityTesting: 2,
              dependencyScanning: 2,
              secretsManagement: 3,
              securityRequirements: 2,
              vulnerabilityManagement: 3,
              incidentResponse: true,
              securityTesting: 2
            },
            monthlyUpdate: {
              currentPeriod: "Expanding security testing and recruiting champion",
              nextPeriod: "Security champion onboarding and threat modeling",
              trend: "improving",
              keyMetric: "Data warehouse security coverage: 75%"
            }
          },
          {
            id: "bi-reporting",
            name: "BI & Reporting",
            practices: {
              embeddedSecurityExperts: true,
              threatModeling: 3,
              secureCodeReview: true,
              automatedSecurityTesting: 3,
              dependencyScanning: 2,
              secretsManagement: 3,
              securityRequirements: 3,
              vulnerabilityManagement: 3,
              incidentResponse: true,
              securityTesting: 3
            },
            monthlyUpdate: {
              currentPeriod: "Advanced report security and self-service governance",
              nextPeriod: "Enhanced data visualization security and user training",
              trend: "stable",
              keyMetric: "BI security framework: 100% report coverage"
            }
          }
        ]
      }
    ]
  };

  // Calculate RAG status based on practices
  const calculateRAGStatus = (practices) => {
    let score = 0;
    let maxScore = 0;
    
    Object.entries(practices).forEach(([key, value]) => {
      const practice = securityPractices[key];
      if (!practice) return;
      
      if (practice.type === 'boolean') {
        score += value ? 1 : 0;
        maxScore += 1;
      } else if (practice.type === 'maturity') {
        score += value / 4;
        maxScore += 1;
      }
    });
    
    const percentage = maxScore > 0 ? score / maxScore : 0;
    
    if (percentage >= 0.75) return 'green';
    if (percentage >= 0.4) return 'amber';
    return 'red';
  };

  // Add calculated status to all squads
  const enrichedData = {
    ...organizationData,
    children: organizationData.children.map(bu => ({
      ...bu,
      children: bu.children.map(squad => ({
        ...squad,
        status: calculateRAGStatus(squad.practices)
      }))
    }))
  };

  const ragConfig = {
    green: {
      name: "Green",
      color: "#10B981",
      description: "Strong security practices"
    },
    amber: {
      name: "Amber", 
      color: "#F59E0B",
      description: "Developing security practices"
    },
    red: {
      name: "Red",
      color: "#EF4444", 
      description: "Early stage security practices"
    }
  };

  const trendConfig = {
    improving: {
      name: "Improving",
      icon: TrendingUp,
      color: "#10B981"
    },
    stable: {
      name: "Stable",
      icon: Minus,
      color: "#6B7280"
    },
    declining: {
      name: "Needs Attention",
      icon: TrendingDown,
      color: "#F59E0B"
    }
  };

  // Handle responsive sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const width = Math.min(container.offsetWidth - 40, 1000);
        const height = Math.min(window.innerHeight * 0.6, 600);
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    if (selectedBusinessUnit) {
      drawBusinessUnitView(svg);
    } else {
      drawOrganizationView(svg);
    }
  }, [selectedBusinessUnit, dimensions]);

  const drawOrganizationView = (svg) => {
    const { width, height } = dimensions;
    
    // Perfect grid layout for equal-sized boxes
    const businessUnits = enrichedData.children;
    const cols = 2;
    const rows = 2;
    
    const padding = 20;
    const boxWidth = (width - padding * 3) / cols; // 3 gaps: left, middle, right
    const boxHeight = (height - padding * 3) / rows; // 3 gaps: top, middle, bottom
    
    businessUnits.forEach((bu, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + col * (boxWidth + padding);
      const y = padding + row * (boxHeight + padding);
      
      // Calculate dominant status
      const statusCounts = { green: 0, amber: 0, red: 0 };
      bu.children.forEach(squad => {
        statusCounts[squad.status]++;
      });
      
      let dominantStatus = 'green';
      if (statusCounts.red > 0) dominantStatus = 'red';
      else if (statusCounts.amber > statusCounts.green) dominantStatus = 'amber';
      
      // Calculate dominant trend
      const trendCounts = { improving: 0, stable: 0, declining: 0 };
      bu.children.forEach(squad => {
        trendCounts[squad.monthlyUpdate.trend]++;
      });
      
      let dominantTrend = 'stable';
      const maxTrend = Math.max(trendCounts.improving, trendCounts.stable, trendCounts.declining);
      if (trendCounts.improving === maxTrend) dominantTrend = 'improving';
      else if (trendCounts.declining === maxTrend) dominantTrend = 'declining';
      
      // Create business unit group
      const buGroup = svg.append("g")
        .attr("class", "business-unit")
        .style("cursor", "pointer")
        .on("click", () => {
          setSelectedBusinessUnit(bu.id);
        })
        .on("mouseover", function(event) {
          d3.select(this).select("rect").attr("opacity", 0.8);
          showBusinessUnitTooltip(event, bu);
        })
        .on("mouseout", function() {
          d3.select(this).select("rect").attr("opacity", 0.9);
          hideTooltip();
        });
      
      // Background rectangle
      buGroup.append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .attr("fill", ragConfig[dominantStatus].color)
        .attr("stroke", "#1F2937")
        .attr("stroke-width", 2)
        .attr("rx", 8)
        .attr("opacity", 0.9);
      
      // Typography scaling based on screen dimensions
      const baseScale = Math.min(dimensions.width / 800, dimensions.height / 500);
      const fontScale = Math.max(0.6, Math.min(1.4, baseScale)); // Clamp between 60% and 140%
      
      // Business unit name - responsive but clean
      buGroup.append("text")
        .attr("x", x + boxWidth / 2)
        .attr("y", y + 30 * fontScale)
        .text(bu.name)
        .attr("text-anchor", "middle")
        .attr("font-size", Math.round(18 * fontScale) + "px")
        .attr("font-weight", "600")
        .attr("font-family", "ui-sans-serif, system-ui, sans-serif")
        .attr("fill", "#FFFFFF")
        .style("pointer-events", "none");
      
      // Squad count - responsive
      buGroup.append("text")
        .attr("x", x + boxWidth / 2)
        .attr("y", y + boxHeight - (30 * fontScale))
        .text(`${bu.squadCount} squads`)
        .attr("text-anchor", "middle")
        .attr("font-size", Math.round(14 * fontScale) + "px")
        .attr("font-weight", "400")
        .attr("font-family", "ui-sans-serif, system-ui, sans-serif")
        .attr("fill", "#E5E7EB")
        .style("pointer-events", "none");
      
      // Trend indicator - responsive size
      const trendSize = Math.round(18 * fontScale);
      const trendInfo = trendConfig[dominantTrend];
      const trendGroup = buGroup.append("g")
        .attr("transform", `translate(${x + boxWidth - trendSize - (12 * fontScale)}, ${y + trendSize + (12 * fontScale)})`);
      
      trendGroup.append("circle")
        .attr("r", trendSize)
        .attr("fill", "rgba(0,0,0,0.7)")
        .attr("stroke", trendInfo.color)
        .attr("stroke-width", Math.max(1, Math.round(2 * fontScale)));
      
      // Clean trend icon - responsive size
      const iconSize = trendSize * 0.6;
      if (dominantTrend === 'improving') {
        trendGroup.append("path")
          .attr("d", `M${-iconSize},${iconSize*0.7} L0,${-iconSize} L${iconSize},${iconSize*0.7} M0,${-iconSize} L0,${iconSize*0.4}`)
          .attr("stroke", trendInfo.color)
          .attr("stroke-width", Math.max(1.5, Math.round(2.5 * fontScale)))
          .attr("fill", "none")
          .attr("stroke-linecap", "round");
      } else if (dominantTrend === 'declining') {
        trendGroup.append("path")
          .attr("d", `M${-iconSize},${-iconSize*0.7} L0,${iconSize} L${iconSize},${-iconSize*0.7} M0,${iconSize} L0,${-iconSize*0.4}`)
          .attr("stroke", trendInfo.color)
          .attr("stroke-width", Math.max(1.5, Math.round(2.5 * fontScale)))
          .attr("fill", "none")
          .attr("stroke-linecap", "round");
      } else {
        trendGroup.append("path")
          .attr("d", `M${-iconSize},0 L${iconSize},0`)
          .attr("stroke", trendInfo.color)
          .attr("stroke-width", Math.max(1.5, Math.round(2.5 * fontScale)))
          .attr("stroke-linecap", "round");
      }
    });
  };

  const drawBusinessUnitView = (svg) => {
    const { width, height } = dimensions;
    
    const buData = enrichedData.children.find(bu => bu.id === selectedBusinessUnit);
    if (!buData) return;

    // Manual grid layout for equal-sized squad boxes
    const squads = buData.children;
    const cols = Math.ceil(Math.sqrt(squads.length)); // Dynamic grid based on squad count
    const rows = Math.ceil(squads.length / cols);
    
    const padding = 15;
    const boxWidth = (width - padding * (cols + 1)) / cols;
    const boxHeight = (height - padding * (rows + 1)) / rows;
    
    squads.forEach((squad, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + col * (boxWidth + padding);
      const y = padding + row * (boxHeight + padding);
      
      // Calculate practice adoption
      let totalPractices = 0;
      let adoptedPractices = 0;
      
      Object.entries(squad.practices).forEach(([key, value]) => {
        const practice = securityPractices[key];
        if (!practice) return;
        
        totalPractices++;
        if (practice.type === 'boolean') {
          adoptedPractices += value ? 1 : 0;
        } else if (practice.type === 'maturity') {
          adoptedPractices += value >= 3 ? 1 : 0;
        }
      });
      
      // Create squad group
      const squadGroup = svg.append("g")
        .attr("class", "squad")
        .style("cursor", "pointer")
        .on("mouseover", function(event) {
          d3.select(this).select("rect").attr("opacity", 1);
          showSquadTooltip(event, squad);
        })
        .on("mouseout", function() {
          d3.select(this).select("rect").attr("opacity", 0.9);
          hideTooltip();
        });
      
      // Background rectangle
      squadGroup.append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .attr("fill", ragConfig[squad.status].color)
        .attr("stroke", "#1F2937")
        .attr("stroke-width", 2)
        .attr("rx", 6)
        .attr("opacity", 0.9);
      
      // Typography scaling based on screen dimensions
      const baseScale = Math.min(dimensions.width / 800, dimensions.height / 500);
      const fontScale = Math.max(0.6, Math.min(1.4, baseScale)); // Clamp between 60% and 140%
      
      // Typography redesign - responsive and clean
      const centerX = x + boxWidth / 2;
      const topPadding = Math.round(20 * fontScale);
      const lineHeight = Math.round(22 * fontScale);
      
      // Squad name - responsive but clean
      squadGroup.append("text")
        .attr("x", centerX)
        .attr("y", y + topPadding)
        .text(squad.name)
        .attr("text-anchor", "middle")
        .attr("font-size", Math.round(16 * fontScale) + "px")
        .attr("font-weight", "600")
        .attr("font-family", "ui-sans-serif, system-ui, sans-serif")
        .attr("fill", "#FFFFFF")
        .style("pointer-events", "none");
      
      // Practice count - large, prominent, responsive
      squadGroup.append("text")
        .attr("x", centerX)
        .attr("y", y + topPadding + lineHeight * 2)
        .text(`${adoptedPractices}/${totalPractices}`)
        .attr("text-anchor", "middle")
        .attr("font-size", Math.round(24 * fontScale) + "px")
        .attr("font-weight", "700")
        .attr("font-family", "ui-mono, monospace")
        .attr("fill", adoptedPractices >= totalPractices * 0.75 ? "#10B981" : 
                     adoptedPractices >= totalPractices * 0.4 ? "#F59E0B" : "#EF4444")
        .style("pointer-events", "none");
      
      // "practices adopted" label - responsive
      squadGroup.append("text")
        .attr("x", centerX)
        .attr("y", y + topPadding + lineHeight * 3)
        .text("practices adopted")
        .attr("text-anchor", "middle")
        .attr("font-size", Math.round(12 * fontScale) + "px")
        .attr("font-weight", "400")
        .attr("font-family", "ui-sans-serif, system-ui, sans-serif")
        .attr("fill", "#D1D5DB")
        .style("pointer-events", "none");
      
      // Trend indicator - responsive size
      const trendSize = Math.round(16 * fontScale);
      const trendInfo = trendConfig[squad.monthlyUpdate.trend];
      const trendGroup = squadGroup.append("g")
        .attr("transform", `translate(${x + boxWidth - trendSize - (10 * fontScale)}, ${y + boxHeight - trendSize - (10 * fontScale)})`);
      
      trendGroup.append("circle")
        .attr("r", trendSize)
        .attr("fill", "rgba(0,0,0,0.7)")
        .attr("stroke", trendInfo.color)
        .attr("stroke-width", Math.max(1, Math.round(2 * fontScale)));
      
      // Simple trend icon - responsive size
      const iconSize = trendSize * 0.6;
      if (squad.monthlyUpdate.trend === 'improving') {
        trendGroup.append("path")
          .attr("d", `M${-iconSize},${iconSize*0.7} L0,${-iconSize} L${iconSize},${iconSize*0.7} M0,${-iconSize} L0,${iconSize*0.3}`)
          .attr("stroke", trendInfo.color)
          .attr("stroke-width", Math.max(1.5, Math.round(2 * fontScale)))
          .attr("fill", "none")
          .attr("stroke-linecap", "round");
      } else if (squad.monthlyUpdate.trend === 'declining') {
        trendGroup.append("path")
          .attr("d", `M${-iconSize},${-iconSize*0.7} L0,${iconSize} L${iconSize},${-iconSize*0.7} M0,${iconSize} L0,${-iconSize*0.3}`)
          .attr("stroke", trendInfo.color)
          .attr("stroke-width", Math.max(1.5, Math.round(2 * fontScale)))
          .attr("fill", "none")
          .attr("stroke-linecap", "round");
      } else {
        trendGroup.append("path")
          .attr("d", `M${-iconSize},0 L${iconSize},0`)
          .attr("stroke", trendInfo.color)
          .attr("stroke-width", Math.max(1.5, Math.round(2 * fontScale)))
          .attr("stroke-linecap", "round");
      }
    });
  };

  const showBusinessUnitTooltip = (event, data) => {
    const statusCounts = { green: 0, amber: 0, red: 0 };
    data.children.forEach(squad => statusCounts[squad.status]++);
    
    setHoveredItem({
      type: 'businessUnit',
      name: data.name,
      squadCount: data.squadCount,
      statusCounts
    });
    showTooltip(event);
  };

  const showSquadTooltip = (event, data) => {
    setHoveredItem({
      type: 'squad',
      ...data
    });
    showTooltip(event);
  };

  const showTooltip = (event) => {
    const tooltip = d3.select(tooltipRef.current);
    tooltip
      .style("opacity", 1)
      .style("left", Math.min(event.pageX + 15, window.innerWidth - 400) + "px")
      .style("top", Math.max(event.pageY - 10, 10) + "px");
  };

  const hideTooltip = () => {
    const tooltip = d3.select(tooltipRef.current);
    setHoveredItem(null);
    tooltip.style("opacity", 0);
  };

  const wrapText = (text, width) => {
    text.each(function() {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      let word;
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.1;
      const y = text.attr("y");
      const x = text.attr("x");
      let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y);
      
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + "em").text(word);
        }
      }
    });
  };

  const resetView = () => {
    setSelectedBusinessUnit(null);
  };

  const getBusinessUnitName = () => {
    const bu = enrichedData.children.find(bu => bu.id === selectedBusinessUnit);
    return bu ? bu.name : '';
  };

  const renderPracticeValue = (practice, value) => {
    if (practice.type === 'boolean') {
      return value ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400" />
      );
    } else if (practice.type === 'maturity') {
      return (
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4].map(level => (
            <Circle 
              key={level}
              className={`w-2 h-2 ${level <= value ? 'fill-current text-blue-400' : 'text-gray-600'}`}
            />
          ))}
          <span className="text-xs ml-1">{value}/4</span>
        </div>
      );
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Security Practices Monthly Update
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <p className="text-slate-400 text-sm md:text-base">
                  {currentPeriod} • {selectedBusinessUnit ? getBusinessUnitName() : "Organization Overview"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedBusinessUnit && (
                <button
                  onClick={resetView}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}
              <button
                onClick={resetView}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Instructions */}
        <div className="mb-4 text-center">
          <p className="text-sm text-slate-400">
            {selectedBusinessUnit ? 'Hover over squads for security practices and monthly progress' : 'Click business units to drill down • Perfect grid layout with responsive fonts'}
          </p>
        </div>

        {/* Treemap Visualization */}
        <div ref={containerRef} className="bg-slate-800/30 rounded-xl border border-slate-600 p-4 mb-6">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="border border-slate-600 rounded-lg bg-slate-900/50 w-full"
          />
        </div>

        {/* Status Legend and Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/30 rounded-xl border border-slate-600 p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-400" />
              Security Practices Assessed (10)
            </h3>
            <div className="space-y-2 text-xs">
              {Object.entries(securityPractices).map(([key, practice]) => (
                <div key={key} className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white text-xs">{practice.name}</span>
                      <span className={`text-xs px-1 py-0.5 rounded-full ${
                        practice.type === 'boolean' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'
                      }`}>
                        {practice.type === 'boolean' ? 'Y/N' : '1-4'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{practice.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-xl border border-slate-600 p-4">
            <h3 className="text-lg font-semibold mb-4">RAG & Trend Legend</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-300">Status (Auto-calculated)</h4>
                {Object.entries(ragConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-xs text-slate-400">{config.name}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-300">Monthly Trend</h4>
                {Object.entries(trendConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <config.icon className="w-3 h-3" style={{ color: config.color }} />
                    <span className="text-xs text-slate-400">{config.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
              <p className="text-xs text-slate-400">
                Perfect 2x2 grid with equal boxes and responsive fonts
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Complete Tooltip with Security Practices + Monthly Update */}
      <div
        ref={tooltipRef}
        className="fixed pointer-events-none z-50 bg-slate-900/95 backdrop-blur-sm border border-slate-600 rounded-lg p-4 shadow-2xl opacity-0 transition-opacity max-w-lg"
      >
        {hoveredItem && (
          <div>
            <h4 className="font-bold text-blue-400 mb-3 text-sm">{hoveredItem.name}</h4>
            
            {hoveredItem.type === 'businessUnit' ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Squads:</span>
                  <span className="text-white">{hoveredItem.squadCount}</span>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-3 h-3 rounded bg-green-500 mx-auto mb-1"></div>
                      <div className="text-white font-medium">{hoveredItem.statusCounts.green}</div>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 rounded bg-amber-500 mx-auto mb-1"></div>
                      <div className="text-white font-medium">{hoveredItem.statusCounts.amber}</div>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 rounded bg-red-500 mx-auto mb-1"></div>
                      <div className="text-white font-medium">{hoveredItem.statusCounts.red}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <div className="flex items-center space-x-2">
                    <span 
                      className="font-medium"
                      style={{ color: ragConfig[hoveredItem.status]?.color }}
                    >
                      {ragConfig[hoveredItem.status]?.name}
                    </span>
                    <div className="flex items-center">
                      {hoveredItem.monthlyUpdate?.trend && (
                        React.createElement(trendConfig[hoveredItem.monthlyUpdate.trend].icon, {
                          className: "w-3 h-3",
                          style: { color: trendConfig[hoveredItem.monthlyUpdate.trend].color }
                        })
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Security Practices Section */}
                {hoveredItem.practices && (
                  <div className="pt-2 border-t border-slate-700">
                    <h5 className="text-slate-300 font-medium mb-2">Security Practices:</h5>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(hoveredItem.practices).slice(0, 8).map(([key, value]) => {
                        const practice = securityPractices[key];
                        if (!practice) return null;
                        
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-slate-300 text-xs truncate mr-1">{practice.name.split(' ').slice(0, 2).join(' ')}:</span>
                            <div className="flex items-center">
                              {renderPracticeValue(practice, value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {Object.keys(hoveredItem.practices).length > 8 && (
                      <p className="text-slate-500 text-xs mt-1">+{Object.keys(hoveredItem.practices).length - 8} more practices...</p>
                    )}
                  </div>
                )}

                {/* Monthly Update Section */}
                {hoveredItem.monthlyUpdate && (
                  <div className="space-y-2 pt-2 border-t border-slate-700">
                    <h5 className="text-slate-300 font-medium mb-2">Monthly Update:</h5>
                    <div>
                      <h6 className="text-slate-400 font-medium mb-1">Current Period:</h6>
                      <p className="text-slate-300">{hoveredItem.monthlyUpdate.currentPeriod}</p>
                    </div>
                    <div>
                      <h6 className="text-slate-400 font-medium mb-1">Next Period:</h6>
                      <p className="text-slate-300">{hoveredItem.monthlyUpdate.nextPeriod}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-700">
                      <h6 className="text-slate-400 font-medium mb-1">Key Metric:</h6>
                      <p className="text-blue-300">{hoveredItem.monthlyUpdate.keyMetric}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfectGridTreemap;
