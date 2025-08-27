import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Building, FileText, Users, Shield, TrendingUp, Clock, AlertTriangle, CheckCircle, ArrowRight, Star } from "lucide-react";

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
      <header className="fixed top-0 w-full z-50 backdrop-blur-sm bg-background/80 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">TeamForm</h1>
          </div>
          <Button onClick={() => navigate('/auth')} size="sm">
            Get Started
          </Button>
        </div>
      </header>

      {/* Slide 1: Hero */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Star className="h-4 w-4 mr-2" />
              HIPAA Compliant Healthcare Forms Platform
            </div>
            <h1 className="text-6xl font-bold tracking-tight mb-6">
              Healthcare Forms
              <span className="text-primary block">Reimagined</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Stop wasting time with paper forms and complex systems. TeamForm makes healthcare data collection effortless, secure, and collaborative.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Watch Demo
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
              <h2 className="text-5xl font-bold mb-6">Meet TeamForm</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                The all-in-one healthcare forms platform that saves time, reduces errors, and improves patient care
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
                    <p className="text-muted-foreground">Create custom healthcare forms in minutes with our intuitive drag-and-drop interface</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
                    <p className="text-muted-foreground">Real-time collaboration with role-based permissions for your entire medical team</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">HIPAA Compliance</h3>
                    <p className="text-muted-foreground">Built-in security features ensure patient data protection and regulatory compliance</p>
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

      {/* Slide 4: Market Opportunity */}
      <section className="min-h-screen flex items-center justify-center py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-12">Massive Market Opportunity</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <Card className="p-8">
                <div className="text-4xl font-bold text-primary mb-4">$50B</div>
                <h3 className="text-xl font-semibold mb-2">Healthcare IT Market</h3>
                <p className="text-muted-foreground">Growing at 15% annually with increasing digitization needs</p>
              </Card>
              
              <Card className="p-8">
                <div className="text-4xl font-bold text-primary mb-4">250K+</div>
                <h3 className="text-xl font-semibold mb-2">Medical Practices</h3>
                <p className="text-muted-foreground">In the US alone still using outdated form systems</p>
              </Card>
              
              <Card className="p-8">
                <div className="text-4xl font-bold text-primary mb-4">$2.3K</div>
                <h3 className="text-xl font-semibold mb-2">Average Monthly Savings</h3>
                <p className="text-muted-foreground">Per practice using digital form solutions</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 5: Traction */}
      <section className="min-h-screen flex items-center justify-center py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">Proven Results</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Healthcare providers trust TeamForm to streamline their operations
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
                  "TeamForm reduced our patient intake time by 80% and eliminated data entry errors. It's been transformative for our practice."
                </blockquote>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Dr. Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">Medical Director, Metro Health</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 6: Call to Action */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-6xl font-bold mb-6">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join hundreds of healthcare providers who've already revolutionized their form management with TeamForm.
            </p>
            
            <div className="flex items-center justify-center space-x-8 mb-12">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Free 30-day trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Setup in 5 minutes</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-xl px-12 py-8">
                Start Your Free Trial
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button variant="outline" size="lg" className="text-xl px-12 py-8">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 TeamForm. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
