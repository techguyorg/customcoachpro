import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src={logo} alt="CustomCoachPro" className="w-7 h-7" />
              <span className="font-display font-bold">CustomCoachPro</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              The complete fitness platform for enthusiasts and professionals.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-medium text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CustomCoachPro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;