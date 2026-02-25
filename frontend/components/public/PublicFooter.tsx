import Link from "next/link"
import { Github, Mail, Phone, Twitter, Linkedin, ArrowUpRight, GraduationCap } from "lucide-react"

export default function PublicFooter() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="relative border-t bg-gradient-to-b from-background to-muted/20">
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[200px] w-[200px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[200px] w-[200px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          
          {/* Brand Section - Enhanced */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg ring-1 ring-primary/20">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  EduFlow
                </h3>
                <p className="text-xs text-muted-foreground">
                  Empowering Education Through Technology
                </p>
              </div>
            </Link>
            
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Transform your learning experience with our comprehensive coaching platform. 
              Access quality education anytime, anywhere.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3 pt-2">
              <Link href="#" className="rounded-full bg-muted/50 p-2 hover:bg-primary hover:text-primary-foreground transition-all">
                <Twitter className="h-4 w-4" />
              </Link>
              <Link href="#" className="rounded-full bg-muted/50 p-2 hover:bg-primary hover:text-primary-foreground transition-all">
                <Linkedin className="h-4 w-4" />
              </Link>
              <Link href="#" className="rounded-full bg-muted/50 p-2 hover:bg-primary hover:text-primary-foreground transition-all">
                <Github className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground">
              Platform
            </h4>
            <ul className="space-y-3">
              {['Features', 'Pricing', 'Faculty', 'Success Stories'].map((item) => (
                <li key={item}>
                  <Link 
                    href="#" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                  >
                    {item}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground">
              Support
            </h4>
            <ul className="space-y-3">
              {['Help Center', 'Contact Us', 'FAQ', 'Community'].map((item) => (
                <li key={item}>
                  <Link 
                    href="#" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                  >
                    {item}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground">
              Legal
            </h4>
            <ul className="space-y-3">
              {['Privacy', 'Terms', 'Cookie Policy', 'Licenses'].map((item) => (
                <li key={item}>
                  <Link 
                    href="#" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                  >
                    {item}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="mt-12 p-6 rounded-2xl bg-muted/30 border border-muted">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>support@eduflow.com</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>24/7 Support Available</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} EduFlow Coaching Platform. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Designed with ❤️ for better education
          </p>
        </div>
      </div>
    </footer>
  )
}