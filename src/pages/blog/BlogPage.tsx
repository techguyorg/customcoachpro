import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Calendar, Clock, User, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  category: string | null;
  published_at: string;
  read_time_minutes: number;
  author_name: string;
  author_avatar: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  
  const currentPage = parseInt(searchParams.get("page") || "1");
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["blog-posts", currentPage, category, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", "9");
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      
      return api.get<{ posts: BlogPost[]; pagination: PaginationData }>(`/api/blog/posts?${params}`);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: () => api.get<{ category: string; count: number }[]>("/api/blog/categories"),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleCategoryFilter = (cat: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (cat) {
      params.set("category", cat);
    } else {
      params.delete("category");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Fitness Knowledge Hub
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Expert insights on training, nutrition, and fitness coaching to help you reach your goals
          </p>
        </div>

        {/* Search and Categories */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
        </div>

        {/* Category Pills */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={!category ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryFilter(null)}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.category}
                variant={category === cat.category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryFilter(cat.category)}
              >
                {cat.category} ({cat.count})
              </Button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {!isLoading && data?.posts && (
          <>
            {data.posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No articles found</p>
                {search && (
                  <Button variant="link" onClick={() => handleCategoryFilter(null)}>
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.posts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <Card className="overflow-hidden h-full hover:border-primary/50 transition-colors group">
                      {post.cover_image_url ? (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={post.cover_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-4xl">📝</span>
                        </div>
                      )}
                      <CardHeader>
                        {post.category && (
                          <Badge variant="secondary" className="w-fit text-xs">
                            {post.category}
                          </Badge>
                        )}
                        <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="line-clamp-2 mb-4">
                          {post.excerpt}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(post.published_at), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.read_time_minutes} min read
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= data.pagination.totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
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