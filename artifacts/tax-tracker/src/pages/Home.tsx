import { PageTransition } from "@/components/PageTransition";
import { Link } from "wouter";
import { Calculator, ArrowRight, PieChart, ShieldCheck, SlidersHorizontal, Share2, TrendingUp, Globe, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <PageTransition className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] pt-0">
      {/* Background Image Setup */}
      <div className="fixed inset-0 z-[-1] overflow-hidden">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
          alt="Abstract Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="text-center max-w-3xl mx-auto z-10 mt-16 md:mt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>TaxScope Civic Data Platform</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-display font-extrabold text-foreground mb-6 leading-tight"
        >
          Understand Where Your <br className="hidden md:block" />
          <span className="text-gradient">Taxes Go</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
        >
          Stop guessing. Enter your income and instantly visualize exactly how your hard-earned tax dollars are distributed across healthcare, education, defence, and more.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link 
            href="/calculator"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5" />
            Start Calculation
          </Link>
          <Link 
            href="/breakdown"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-lg bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <PieChart className="w-5 h-5" />
            View Budget Breakdown
            <ArrowRight className="w-5 h-5 ml-1" />
          </Link>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-24 w-full max-w-6xl pb-16"
      >
        <FeatureCard 
          title="Personalized Insights" 
          description="See exact dollar amounts contributed to each sector based on your actual income bracket."
          icon={<Calculator className="w-6 h-6 text-primary" />}
        />
        <FeatureCard 
          title="Budget Simulator" 
          description="Disagree with the government? Reallocate the budget yourself and compare side-by-side."
          icon={<SlidersHorizontal className="w-6 h-6 text-accent" />}
        />
        <FeatureCard 
          title="Shareable Cards" 
          description="Export a beautiful summary graphic of your tax breakdown to share on social media."
          icon={<Share2 className="w-6 h-6 text-pink-500" />}
        />
        <FeatureCard 
          title="Lifetime Tax Dashboard" 
          description="Project your total career tax contribution and understand your lifetime impact."
          icon={<TrendingUp className="w-6 h-6 text-green-500" />}
        />
        <FeatureCard 
          title="National Budget Explorer" 
          description="Drill into every spending category of the national budget with detailed sub-categories."
          icon={<Globe className="w-6 h-6 text-blue-500" />}
        />
        <FeatureCard 
          title="Public Sentiment" 
          description="See what other citizens prefer and how it compares to actual government allocation."
          icon={<Users className="w-6 h-6 text-purple-500" />}
        />
      </motion.div>
    </PageTransition>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:bg-card hover:border-white/10 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-display font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
