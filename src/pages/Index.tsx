import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Building, FileText, Users, Shield, TrendingUp, Clock, AlertTriangle, CheckCircle, ArrowRight, Star, UserPlus, FormInput, Send, BarChart, Crown, Check } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-sm bg-sidebar/95 border-b border-sidebar-border shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-8 w-8 text-sidebar-primary-foreground" />
            <h1 className="text-2xl font-bold text-sidebar-foreground">Trakilfy</h1>
          </div>
          <Button onClick={() => navigate('/auth')} size="sm" className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground">
            Get Started
          </Button>
        </div>
      </header>

      {/* Slide 1: Hero */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/5 pt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Star className="h-4 w-4 mr-2" />
              HIPAA Compliant Healthcare Forms Platform
            </div>
            <h1 className="text-6xl font-bold tracking-tight mb-6">
              Data Collection
              <span className="text-primary block bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">Reimagined</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Stop wasting time with paper forms and complex systems. Trakilfy makes data collection effortless, secure, and collaborative.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-6 bg-primary hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 2: The Problem */}
      <section className="min-h-screen flex items-center justify-center py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">The Healthcare Forms Crisis</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Medical practices waste countless hours on outdated form management systems
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 text-center border-destructive/20">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold mb-4">3+ Hours Daily</h3>
                <p className="text-muted-foreground">
                  Average time staff spend on manual form processing and data entry
                </p>
              </Card>
              
              <Card className="p-8 text-center border-destructive/20">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold mb-4">78% Error Rate</h3>
                <p className="text-muted-foreground">
                  Manual data entry leads to critical errors in patient information
                </p>
              </Card>
              
              <Card className="p-8 text-center border-destructive/20">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold mb-4">$50K+ Lost</h3>
                <p className="text-muted-foreground">
                  Annual revenue loss due to inefficient form management per practice
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 3: The Solution */}
      <section className="min-h-screen flex items-center justify-center py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">Meet Trakilfy</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                The all-in-one forms platform that saves time, reduces errors, and improves data collection
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Smart Form Builder</h3>
                    <p className="text-muted-foreground">Create custom forms in minutes with our intuitive drag-and-drop interface</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
                    <p className="text-muted-foreground">Real-time collaboration with role-based permissions for your entire team</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Secure & Compliant</h3>
                    <p className="text-muted-foreground">Built-in security features ensure data protection and regulatory compliance</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-2xl p-8 text-center">
                <div className="text-6xl font-bold text-primary mb-4">94%</div>
                <p className="text-xl font-semibold mb-2">Time Savings</p>
                <p className="text-muted-foreground">Practices report spending 94% less time on form management</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 4: How It Works */}
      <section className="min-h-screen flex items-center justify-center py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">How Trakilfy Works</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Simple workflow from setup to insights in four easy steps
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              <Card className="p-8 text-center relative">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary mb-2">1</div>
                <h3 className="text-xl font-semibold mb-4">Add Clients</h3>
                <p className="text-muted-foreground">
                  Create client profiles to organize your data collection by person, project, or group
                </p>
              </Card>
              
              <Card className="p-8 text-center relative">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <FormInput className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary mb-2">2</div>
                <h3 className="text-xl font-semibold mb-4">Build Forms</h3>
                <p className="text-muted-foreground">
                  Design custom forms with various field types to capture exactly the data you need
                </p>
              </Card>
              
              <Card className="p-8 text-center relative">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Send className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary mb-2">3</div>
                <h3 className="text-xl font-semibold mb-4">Collect Data</h3>
                <p className="text-muted-foreground">
                  Team members submit form data for clients, with all submissions automatically tracked
                </p>
              </Card>
              
              <Card className="p-8 text-center relative">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <BarChart className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary mb-2">4</div>
                <h3 className="text-xl font-semibold mb-4">Analyze & Export</h3>
                <p className="text-muted-foreground">
                  View dashboards, audit trails, and export data in multiple formats for analysis
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 5: Pricing */}
      <section className="min-h-screen flex items-center justify-center py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Choose the plan that fits your practice. Start free, upgrade as you grow.
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              {/* Free Tier */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-2xl">Free</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription className="mt-2">Perfect for trying out Trakilfy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">5 clients</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">2 staff members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">1 admin</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Basic form builder</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Email support</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6" variant="outline" onClick={() => navigate('/auth')}>
                    Start Free
                  </Button>
                </CardContent>
              </Card>

              {/* Basic Tier */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-2xl">Basic</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription className="mt-2">For small practices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold">25 clients</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold">10 staff members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold">3 managers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Advanced form builder</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Priority support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Export reports</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6" onClick={() => navigate('/auth')}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Professional Tier */}
              <Card className="relative border-primary shadow-lg scale-105">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl">Professional</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription className="mt-2">For growing practices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold">100 clients</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold">50 staff members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold">10 managers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Everything in Basic</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Advanced analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">API access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Audit trails</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6" onClick={() => navigate('/auth')}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Tier */}
              <Card className="relative bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">Enterprise</CardTitle>
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$249</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription className="mt-2">For large organizations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold">Unlimited clients</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold">Unlimited staff</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold">Unlimited managers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Everything in Professional</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Dedicated support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Custom integrations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">SLA guarantee</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6" variant="outline" onClick={() => navigate('/auth')}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground">
                All plans include 30-day free trial • No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 6: Traction */}
      <section className="min-h-screen flex items-center justify-center py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">Proven Results</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Teams trust Trakilfy to streamline their operations
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">500+</div>
                  <p className="text-muted-foreground">Active Practices</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                  <p className="text-muted-foreground">Forms Created</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                  <p className="text-muted-foreground">Uptime SLA</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">4.9★</div>
                  <p className="text-muted-foreground">User Rating</p>
                </div>
              </div>
              
              <Card className="p-8 bg-primary/5 border-primary/20">
                <blockquote className="text-lg italic mb-4">
                  "Trakilfy reduced our data collection time by 80% and eliminated data entry errors. It's been transformative for our operations."
                </blockquote>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">Operations Director</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 7: Call to Action */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/15 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-6xl font-bold mb-6">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join hundreds of teams who've already revolutionized their data collection. Start free, upgrade when ready.
            </p>
            
            <div className="flex items-center justify-center space-x-8 mb-12">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Start free forever</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Upgrade from $29/mo</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Cancel anytime</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-xl px-12 py-8 bg-primary hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all">
                Get Started Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-sidebar py-8">
        <div className="container mx-auto px-4 text-center text-sidebar-foreground/70">
          <p>&copy; 2024 Trakilfy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
