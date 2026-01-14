import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, Eye, Share2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface BlogPostDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string | null;
  category: string | null;
  published_at: string;
  read_time_minutes: number;
  view_count: number;
  author_name: string;
  author_avatar: string | null;
  author_bio: string | null;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => api.get<BlogPostDetail>(`/api/blog/posts/${slug}`),
    enabled: !!slug,
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            <span className="font-display font-bold text-lg">CustomCoachPro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/blog")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : post ? (
          <article>
            {/* Category */}
            {post.category && (
              <Badge variant="secondary" className="mb-4">
                {post.category}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(post.published_at), "MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.read_time_minutes} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.view_count} views
              </span>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 mb-8 p-4 bg-card rounded-lg border border-border">
              <Avatar className="w-12 h-12">
                <AvatarImage src={post.author_avatar || undefined} />
                <AvatarFallback>
                  {post.author_name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{post.author_name}</p>
                {post.author_bio && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{post.author_bio}</p>
                )}
              </div>
            </div>

            {/* Cover Image */}
            {post.cover_image_url && (
              <div className="mb-8 rounded-xl overflow-hidden">
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Content */}
            <div 
              className="prose prose-invert prose-lg max-w-none
                prose-headings:text-foreground prose-headings:font-display
                prose-p:text-muted-foreground
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground
                prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-card prose-pre:border prose-pre:border-border
                prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Share CTA */}
            <div className="mt-12 p-6 bg-card rounded-xl border border-border text-center">
              <h3 className="font-semibold mb-2">Enjoyed this article?</h3>
              <p className="text-muted-foreground text-sm mb-4">Share it with your fitness community!</p>
              <Button onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Article
              </Button>
            </div>
          </article>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} CustomCoachPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}