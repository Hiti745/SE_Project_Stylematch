import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type FashionItem = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  color: string;
  price: number;
  description: string;
  visual_theme: string;
};

type View = 'home' | 'catalog' | 'forYou' | 'saved';
type AuthMode = 'login' | 'signup';

type ProductVisualProps = {
  item: FashionItem;
  large?: boolean;
};

const categoryOptions = ['All pieces', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories'];
const navItems: { label: string; view: View }[] = [
  { label: 'Discover', view: 'home' },
  { label: 'Catalog', view: 'catalog' },
  { label: 'For you', view: 'forYou' },
];

const imageBySlug: Record<string, string> = {
  'linen-structure-shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85',
  'meridian-satin-slip': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85',
  'studio-wide-trouser': 'https://images.unsplash.com/photo-1506629905607-d9a9e65d0c5e?auto=format&fit=crop&w=900&q=85',
  'soft-focus-knit': 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85',
  'gallery-leather-tote': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85',
  'after-hours-blazer': 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
  'quiet-form-midi': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=85',
  'everyday-canvas-sneaker': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85',
  'weekend-cropped-cardigan': 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=900&q=85',
  'fluid-pleat-skirt': 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85',
  'foundations-rib-tank': 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=85',
  'sculpted-shoulder-coat': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85',
  'linework-slingback': 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=85',
  'modern-utility-jacket': 'https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?auto=format&fit=crop&w=900&q=85',
  'dawn-column-skirt': 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85',
};

const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(price * 84);

function ProductVisual({ item, large = false }: ProductVisualProps) {
  const imageUrl = imageBySlug[item.slug];

  return (
    <div className={`product-visual ${large ? 'product-visual-large' : ''} ${imageUrl ? 'has-photo' : ''}`} data-theme={item.visual_theme} role="img" aria-label={`${item.name} in ${item.color}`}>
      {imageUrl && <img className="product-photo" src={imageUrl} alt={item.name} loading={large ? 'eager' : 'lazy'} decoding="async" />}
      {imageUrl && <div className="photo-wash" />}
      {!imageUrl && <><div className="visual-orbit visual-orbit-one" /><div className="visual-orbit visual-orbit-two" /><div className="visual-garment"><div className="garment-neck" /><div className="garment-body" /><div className="garment-shadow" /></div></>}
      <div className="visual-grain" />
      <div className="visual-caption">STYLEMATCH / {item.category.toUpperCase()}</div>
      <div className="visual-number">{item.slug.slice(0, 2).toUpperCase()}</div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<FashionItem[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<View>('home');
  const [activeCategory, setActiveCategory] = useState('All pieces');
  const [selectedItem, setSelectedItem] = useState<FashionItem | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const loadLikes = useCallback(async (activeSession: Session | null) => {
    if (!activeSession) {
      setLikedIds(new Set());
      return;
    }

    const { data, error } = await supabase
      .from('item_likes')
      .select('item_id')
      .eq('user_id', activeSession.user.id);

    if (error) {
      setErrorMessage('Your saved styles could not be loaded. Please try again.');
      return;
    }

    setLikedIds(new Set((data ?? []).map((like: { item_id: string }) => like.item_id)));
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const [{ data: catalogData, error: catalogError }, { data: sessionData }] = await Promise.all([
        supabase.from('fashion_items').select('*').order('created_at', { ascending: true }),
        supabase.auth.getSession(),
      ]);

      if (!mounted) return;

      if (catalogError) {
        setErrorMessage('The catalog is taking a moment to arrive. Refresh to try again.');
      } else {
        setItems((catalogData ?? []) as FashionItem[]);
      }

      setSession(sessionData.session);
      await loadLikes(sessionData.session);
      setLoading(false);
    };

    void initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      void (async () => {
        await loadLikes(nextSession);
      })();
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadLikes]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const likedItems = useMemo(
    () => items.filter((item) => likedIds.has(item.id)),
    [items, likedIds],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = activeCategory === 'All pieces' || item.category === activeCategory;
      const matchesSearch = !normalizedSearch || [item.name, item.brand, item.category, item.color].some((value) => value.toLowerCase().includes(normalizedSearch));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, items, searchTerm]);

  const trendingItems = useMemo(() => items.slice(0, 8), [items]);

  const recommendations = useMemo(() => {
    if (likedItems.length === 0) return trendingItems;

    const scores = items
      .filter((item) => !likedIds.has(item.id))
      .map((item) => {
        const score = likedItems.reduce((total, likedItem) => {
          let itemScore = 0;
          if (item.category === likedItem.category) itemScore += 4;
          if (item.subcategory === likedItem.subcategory) itemScore += 3;
          if (item.color === likedItem.color) itemScore += 2;
          if (item.brand === likedItem.brand) itemScore += 1;
          return total + itemScore;
        }, 0);
        return { item, score };
      })
      .sort((a, b) => b.score - a.score);

    return scores.slice(0, 8).map(({ item }) => item);
  }, [items, likedIds, likedItems, trendingItems]);

  const similarItems = useMemo(() => {
    if (!selectedItem) return [];
    return items
      .filter((item) => item.id !== selectedItem.id)
      .map((item) => {
        let score = 0;
        if (item.category === selectedItem.category) score += 4;
        if (item.subcategory === selectedItem.subcategory) score += 3;
        if (item.color === selectedItem.color) score += 2;
        if (item.brand === selectedItem.brand) score += 1;
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ item }) => item);
  }, [items, selectedItem]);

  const navigate = (nextView: View) => {
    setView(nextView);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuth = (mode: AuthMode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
    setErrorMessage('');
  };

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthSubmitting(true);
    setErrorMessage('');

    const result = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
      : await supabase.auth.signUp({ email: authEmail, password: authPassword });

    if (result.error) {
      setErrorMessage(result.error.message.includes('Invalid login credentials') ? 'That email and password do not match.' : result.error.message);
    } else {
      setAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      setToastMessage(authMode === 'login' ? 'Welcome back. Your edit is ready.' : 'Your account is ready. Start shaping your edit.');
    }

    setAuthSubmitting(false);
  };

  const handleLike = async (item: FashionItem) => {
    if (!session) {
      openAuth('login');
      return;
    }

    const isLiked = likedIds.has(item.id);
    setSavingId(item.id);
    setErrorMessage('');

    const result = isLiked
      ? await supabase.from('item_likes').delete().eq('item_id', item.id).eq('user_id', session.user.id)
      : await supabase.from('item_likes').insert({ item_id: item.id });

    if (result.error) {
      setErrorMessage('We could not update your saved styles. Please try again.');
    } else {
      setLikedIds((current) => {
        const next = new Set(current);
        if (isLiked) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
      setToastMessage(isLiked ? 'Removed from your edit.' : 'Saved to your edit.');
    }

    setSavingId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setView('home');
    setToastMessage('You have been signed out.');
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value && view !== 'catalog') setView('catalog');
  };

  const renderSectionTitle = (eyebrow: string, title: string, detail: string, action?: ReactNode) => (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="section-detail">{detail}</p>
      </div>
      {action}
    </div>
  );

  const renderProductCard = (item: FashionItem, index: number) => {
    const isLiked = likedIds.has(item.id);
    return (
      <article className="product-card" key={item.id} style={{ '--delay': `${index * 45}ms` } as React.CSSProperties}>
        <button className="product-image-button" onClick={() => setSelectedItem(item)} aria-label={`View ${item.name}`}>
          <ProductVisual item={item} />
          <span className="card-index">0{index + 1}</span>
        </button>
        <div className="product-meta">
          <div>
            <p className="product-brand">{item.brand}</p>
            <button className="product-name" onClick={() => setSelectedItem(item)}>{item.name}</button>
            <p className="product-category">{item.subcategory} · {item.color}</p>
          </div>
          <div className="product-side-meta">
            <span className="price">{formatPrice(Number(item.price))}</span>
            <button className={`icon-button ${isLiked ? 'is-liked' : ''}`} onClick={() => void handleLike(item)} disabled={savingId === item.id} aria-label={isLiked ? `Remove ${item.name} from saved` : `Save ${item.name}`}>
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderHome = () => (
    <>
      <section className="hero-section page-shell">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="pulse-dot" /> Personal style, made visible</div>
          <h1>Find the pieces<br /><em>that feel like you.</em></h1>
          <p className="hero-description">StyleMatch learns from what catches your eye, then edits the noise down to a considered collection of pieces worth knowing.</p>
          <div className="hero-actions">
            <button className="button button-dark" onClick={() => navigate('catalog')}>Explore the edit <ArrowRight size={17} /></button>
            {!session && <button className="text-button" onClick={() => openAuth('signup')}>Create your profile <ArrowRight size={15} /></button>}
          </div>
          <div className="hero-proof"><ShieldCheck size={15} /><span>Recommendations built from your taste, never your data trail.</span></div>
        </div>
        <div className="hero-art-wrap">
          <div className="hero-art-card">
            {items[1] ? <ProductVisual item={items[1]} large /> : <div className="product-visual product-visual-large" />}
            <div className="hero-art-label"><span>01 / 04</span><strong>New perspective</strong></div>
          </div>
          <div className="hero-float-card"><Sparkles size={16} /><span>For your next chapter</span><ArrowRight size={15} /></div>
        </div>
      </section>

      <section className="proof-strip page-shell">
        <div><span className="proof-number">01</span><span>Browse with intention</span></div>
        <div><span className="proof-number">02</span><span>Save what speaks to you</span></div>
        <div><span className="proof-number">03</span><span>Meet your next favorite</span></div>
      </section>

      <section className="collection-section page-shell">
        {renderSectionTitle(
          session && likedItems.length >= 3 ? 'Your personal edit' : 'The community edit',
          session && likedItems.length >= 3 ? 'Curated for you' : 'Trending now',
          session && likedItems.length >= 3 ? 'A living collection shaped around your saved styles.' : 'A considered starting point while we learn your point of view.',
          <button className="arrow-link" onClick={() => navigate(session && likedItems.length >= 3 ? 'forYou' : 'catalog')}>View all <ArrowRight size={16} /></button>,
        )}
        {session && likedItems.length > 0 && likedItems.length < 3 && (
          <div className="taste-progress"><div className="taste-progress-copy"><span className="progress-icon"><Sparkles size={15} /></span><span><strong>Keep going — your edit is taking shape.</strong><small>Save {3 - likedItems.length} more {3 - likedItems.length === 1 ? 'piece' : 'pieces'} to unlock personal recommendations.</small></span></div><div className="progress-bar"><span style={{ width: `${(likedItems.length / 3) * 100}%` }} /></div></div>
        )}
        <div className="product-grid">{(session && likedItems.length >= 3 ? recommendations : trendingItems).slice(0, 4).map(renderProductCard)}</div>
      </section>

      <section className="story-section page-shell">
        <div className="story-panel story-panel-dark">
          <p className="eyebrow eyebrow-light">The StyleMatch method</p>
          <h2>Less scrolling.<br /><em>More recognition.</em></h2>
          <p>Save the pieces that feel right. We find the patterns — silhouettes, colors, and details — and bring more of that point of view to the surface.</p>
          <button className="button button-light" onClick={() => navigate('forYou')}>See how it works <ArrowRight size={17} /></button>
        </div>
        <div className="story-panel story-panel-light">
          <div className="story-quote">“</div>
          <p className="story-big-copy">A wardrobe is a point of view, not a pile of options.</p>
          <div className="story-footer"><span>StyleMatch journal</span><span>Vol. 01</span></div>
        </div>
      </section>
    </>
  );

  const renderCatalog = () => (
    <section className="page-shell inner-page">
      <div className="inner-page-header">
        <div><p className="eyebrow">The catalog</p><h1>Pieces worth keeping.</h1><p className="inner-description">Explore the full StyleMatch edit, then save anything that feels unmistakably you.</p></div>
        <div className="catalog-count"><strong>{filteredItems.length}</strong><span>pieces<br />in this edit</span></div>
      </div>
      <div className="filter-row">
        <div className="category-pills">{categoryOptions.map((category) => <button key={category} className={`category-pill ${activeCategory === category ? 'active' : ''}`} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
        <div className="sort-control"><span>Sort by</span><strong>Recommended</strong><ChevronDown size={15} /></div>
      </div>
      {filteredItems.length > 0 ? <div className="product-grid product-grid-wide">{filteredItems.map(renderProductCard)}</div> : <div className="empty-state"><Search size={24} /><h3>Nothing matched that search.</h3><p>Try a different category, color, or product name.</p><button className="text-button" onClick={() => { setSearchTerm(''); setActiveCategory('All pieces'); }}>Clear filters <ArrowRight size={15} /></button></div>}
    </section>
  );

  const renderForYou = () => (
    <section className="page-shell inner-page">
      <div className="inner-page-header recommendation-header">
        <div><p className="eyebrow"><Sparkles size={14} /> Recommendation room</p><h1>Made for your point of view.</h1><p className="inner-description">{likedItems.length >= 3 ? 'Every piece below is ranked from the details you keep coming back to.' : 'Your personal edit unlocks after three saved pieces. Until then, start with what the community is loving.'}</p></div>
        <div className="taste-badge"><div className="taste-badge-icon"><Star size={17} fill="currentColor" /></div><span><strong>{likedItems.length} saved</strong><small>{likedItems.length >= 3 ? 'Your taste profile is active' : `${Math.max(0, 3 - likedItems.length)} more to unlock`}</small></span></div>
      </div>
      <div className="recommendation-note"><div className="note-mark"><TrendingUp size={17} /></div><div><strong>{likedItems.length >= 3 ? 'Your recommendations are live.' : 'Trending is your starting point.'}</strong><span>{likedItems.length >= 3 ? 'The more you save, the sharper your edit becomes.' : 'Save three pieces to let StyleMatch learn your preferences.'}</span></div><button className="arrow-link" onClick={() => navigate('catalog')}>Browse catalog <ArrowRight size={16} /></button></div>
      <div className="product-grid product-grid-wide">{recommendations.map(renderProductCard)}</div>
    </section>
  );

  const renderSaved = () => (
    <section className="page-shell inner-page">
      <div className="inner-page-header"><div><p className="eyebrow"><Bookmark size={14} /> Your edit</p><h1>Saved for later.</h1><p className="inner-description">The pieces you paused on, came back to, and decided to keep close.</p></div><div className="catalog-count"><strong>{likedItems.length}</strong><span>saved<br />pieces</span></div></div>
      {likedItems.length > 0 ? <div className="product-grid product-grid-wide">{likedItems.map(renderProductCard)}</div> : <div className="empty-state"><Bookmark size={24} /><h3>Your edit is waiting.</h3><p>Save pieces from the catalog and they’ll live here.</p><button className="button button-dark" onClick={() => navigate('catalog')}>Explore the catalog <ArrowRight size={17} /></button></div>}
    </section>
  );

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner page-shell">
          <button className="brand-mark" onClick={() => navigate('home')} aria-label="StyleMatch home"><span className="brand-symbol"><span /></span><span>StyleMatch</span></button>
          <nav className={`main-nav ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">{navItems.map((item) => <button key={item.view} className={view === item.view ? 'active' : ''} onClick={() => navigate(item.view)}>{item.label}</button>)}<button className={view === 'saved' ? 'active' : ''} onClick={() => session ? navigate('saved') : openAuth('login')}>Saved <span className="nav-count">{likedItems.length > 0 ? likedItems.length : ''}</span></button></nav>
          <div className="header-actions"><label className="search-box"><Search size={16} /><input value={searchTerm} onChange={(event) => handleSearch(event.target.value)} placeholder="Search the edit" aria-label="Search the edit" /></label>{session ? <div className="account-menu"><span className="account-avatar">{session.user.email?.slice(0, 1).toUpperCase() ?? 'S'}</span><button className="account-email" onClick={() => void handleSignOut()} title="Sign out">{session.user.email?.split('@')[0]}<LogOut size={14} /></button></div> : <button className="signin-button" onClick={() => openAuth('login')}><LogIn size={15} /> Sign in</button>}<button className="mobile-menu-button" onClick={() => setMobileMenuOpen((current) => !current)} aria-label="Toggle menu">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
        </div>
      </header>

      <main>{loading ? <div className="loading-state page-shell"><div className="loading-mark"><Sparkles size={20} /></div><p>Preparing your edit...</p></div> : view === 'home' ? renderHome() : view === 'catalog' ? renderCatalog() : view === 'forYou' ? renderForYou() : renderSaved()}</main>

      <footer className="site-footer page-shell"><div className="footer-brand"><span className="brand-symbol"><span /></span><strong>StyleMatch</strong><p>A more intentional way to discover what you’ll wear next.</p></div><div className="footer-links"><div><span>Explore</span><button onClick={() => navigate('catalog')}>Catalog</button><button onClick={() => navigate('forYou')}>For you</button></div><div><span>About</span><button onClick={() => setToastMessage('StyleMatch is a recommendation prototype for your personal edit.')}>Our approach</button><button onClick={() => setToastMessage('Your saved styles are private to your account.')}>Privacy first</button></div></div><div className="footer-bottom"><span>© 2026 StyleMatch</span><span>Designed for better browsing.</span></div></footer>

      {errorMessage && <div className="feedback-banner error-banner"><span>{errorMessage}</span><button onClick={() => setErrorMessage('')} aria-label="Dismiss error"><X size={15} /></button></div>}
      {toastMessage && <div className="feedback-banner toast-banner"><Check size={16} /><span>{toastMessage}</span></div>}

      {selectedItem && <div className="modal-backdrop" onClick={() => setSelectedItem(null)}><aside className="detail-drawer" onClick={(event) => event.stopPropagation()}><button className="drawer-close" onClick={() => setSelectedItem(null)} aria-label="Close product details"><X size={19} /></button><ProductVisual item={selectedItem} large /><div className="drawer-content"><p className="eyebrow">{selectedItem.brand} / {selectedItem.category}</p><h2>{selectedItem.name}</h2><div className="drawer-price-row"><span className="drawer-price">{formatPrice(Number(selectedItem.price))}</span><span className="drawer-color"><span className="color-dot" data-color={selectedItem.visual_theme} /> {selectedItem.color}</span></div><p className="drawer-description">{selectedItem.description}</p><button className={`button full-width-button ${likedIds.has(selectedItem.id) ? 'button-saved' : 'button-dark'}`} onClick={() => void handleLike(selectedItem)}>{likedIds.has(selectedItem.id) ? <><Check size={17} /> Saved to your edit</> : <><Heart size={17} /> Save this piece</>}</button><div className="similar-section"><div className="similar-heading"><div><p className="eyebrow">You might also like</p><h3>More in this mood</h3></div><span>04 pieces</span></div><div className="similar-grid">{similarItems.map((item) => <button key={item.id} className="similar-card" onClick={() => setSelectedItem(item)}><ProductVisual item={item} /><span>{item.name}</span><small>{formatPrice(Number(item.price))}</small></button>)}</div></div></div></aside></div>}

      {authModalOpen && <div className="modal-backdrop" onClick={() => setAuthModalOpen(false)}><div className="auth-modal" onClick={(event) => event.stopPropagation()}><button className="drawer-close" onClick={() => setAuthModalOpen(false)} aria-label="Close sign in"><X size={19} /></button><div className="auth-mark"><Compass size={22} /></div><p className="eyebrow">Your style, in focus</p><h2>{authMode === 'login' ? 'Welcome back.' : 'Start your edit.'}</h2><p className="auth-intro">{authMode === 'login' ? 'Sign in to pick up where your taste left off.' : 'Create a profile to save pieces and unlock your personal recommendations.'}</p><form onSubmit={handleAuth} className="auth-form"><label>Email address<input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} required /></label><button className="button button-dark full-width-button" disabled={authSubmitting}>{authSubmitting ? 'One moment...' : authMode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button></form><button className="auth-switch" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setErrorMessage(''); }}>{authMode === 'login' ? 'New to StyleMatch? Create an account' : 'Already have an account? Sign in'}</button></div></div>}
    </div>
  );
}

export default App;
