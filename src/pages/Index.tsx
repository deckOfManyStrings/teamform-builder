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
              Client Data Management Platform
            </div>
            <h1 className="text-6xl font-bold tracking-tight mb-6">
              Data Collection
              <span className="text-primary block bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">Simplified</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Build custom forms, collect client data, and collaborate with your team—all in one secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-6 bg-primary hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 2: Key Features */}
      <section className="min-h-screen flex items-center justify-center py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">Everything You Need</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                A complete platform for managing client data and forms
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Custom Form Builder</h3>
                <p className="text-muted-foreground">
                  Create forms with various field types to capture exactly the data you need
                </p>
              </Card>
              
              <Card className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Team Collaboration</h3>
                <p className="text-muted-foreground">
                  Role-based permissions with managers, staff, and admins working together
                </p>
              </Card>
              
              <Card className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <BarChart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Analytics & Export</h3>
                <p className="text-muted-foreground">
                  View dashboards, audit trails, and export data in multiple formats
                </p>
              </Card>
              
              <Card className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Secure Storage</h3>
                <p className="text-muted-foreground">
                  Your client data is encrypted and securely stored with regular backups
                </p>
              </Card>
              
              <Card className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Client Management</h3>
                <p className="text-muted-foreground">
                  Organize submissions by client with detailed profiles and history
                </p>
              </Card>
              
              <Card className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Audit Trails</h3>
                <p className="text-muted-foreground">
                  Track all changes and submissions with complete audit history
                </p>
              </Card>
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
                Start free • No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Slide 7: Call to Action */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/15 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-6xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Start managing your client data more efficiently today. No credit card required.
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
