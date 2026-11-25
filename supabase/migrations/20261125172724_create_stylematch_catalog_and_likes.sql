/*
# Create StyleMatch catalog and user likes

1. New Tables
- `fashion_items`: public catalog entries used for browsing, recommendations, and similar-item matching.
  - `id`: generated UUID primary key.
  - `slug`: stable, human-readable unique identifier.
  - `name`: display name for the item.
  - `brand`: brand label shown on cards and detail views.
  - `category`: broad category used for filters and matching.
  - `subcategory`: more specific product type used for matching.
  - `color`: primary color family used for matching.
  - `price`: item price in the catalog currency.
  - `description`: short editorial product description.
  - `visual_theme`: controlled visual palette key used by the prototype when a product photo is unavailable.
  - `created_at`: creation timestamp.
- `item_likes`: private per-user implicit preference records.
  - `user_id`: authenticated owner, defaulted from the active session.
  - `item_id`: liked catalog item.
  - `created_at`: time the preference was recorded.

2. Security
- Enable row-level security on both tables.
- Catalog rows are readable by guests and signed-in users; catalog writes are not exposed to the browser.
- Likes are restricted to the signed-in owner for all four CRUD operations.
- Grant only the table operations required by the browser.

3. Seed Data
- Add a curated, stable catalog of 15 fashion items across tops, bottoms, dresses, outerwear, and accessories.
- Seed rows use stable slugs so this migration can safely be reapplied without duplicate products.

4. Important Notes
- This prototype uses catalog metadata to calculate similar and recommended items in the browser.
- No passwords or user records are created here; authentication remains managed by Supabase Auth.
*/

CREATE TABLE IF NOT EXISTS public.fashion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL,
  subcategory text NOT NULL,
  color text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  description text NOT NULL,
  visual_theme text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.item_likes (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.fashion_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

ALTER TABLE public.fashion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_likes ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.fashion_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_likes TO authenticated;

DROP POLICY IF EXISTS "Anyone can browse fashion items" ON public.fashion_items;
CREATE POLICY "Anyone can browse fashion items"
ON public.fashion_items FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Catalog inserts are disabled" ON public.fashion_items;
CREATE POLICY "Catalog inserts are disabled"
ON public.fashion_items FOR INSERT
TO anon, authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Catalog updates are disabled" ON public.fashion_items;
CREATE POLICY "Catalog updates are disabled"
ON public.fashion_items FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Catalog deletes are disabled" ON public.fashion_items;
CREATE POLICY "Catalog deletes are disabled"
ON public.fashion_items FOR DELETE
TO anon, authenticated
USING (false);

DROP POLICY IF EXISTS "Users can view their own likes" ON public.item_likes;
CREATE POLICY "Users can view their own likes"
ON public.item_likes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own likes" ON public.item_likes;
CREATE POLICY "Users can create their own likes"
ON public.item_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own likes" ON public.item_likes;
CREATE POLICY "Users can update their own likes"
ON public.item_likes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.item_likes;
CREATE POLICY "Users can delete their own likes"
ON public.item_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

INSERT INTO public.fashion_items (slug, name, brand, category, subcategory, color, price, description, visual_theme)
VALUES
  ('linen-structure-shirt', 'Linen Structure Shirt', 'Aster Row', 'Tops', 'Shirt', 'Oat', 118.00, 'A relaxed linen shirt with a precise collar and an easy, everyday drape.', 'oat'),
  ('meridian-satin-slip', 'Meridian Satin Slip', 'Morrow Studio', 'Dresses', 'Slip dress', 'Ink', 164.00, 'A fluid satin silhouette cut for evenings that start late and end beautifully.', 'ink'),
  ('studio-wide-trouser', 'Studio Wide Trouser', 'Aster Row', 'Bottoms', 'Trousers', 'Stone', 142.00, 'A polished wide leg with a quiet structure and a softly tailored waist.', 'stone'),
  ('soft-focus-knit', 'Soft Focus Knit', 'Northline', 'Tops', 'Knit top', 'Sage', 96.00, 'A fine-gauge knit in a muted green with a softly sculpted neckline.', 'sage'),
  ('gallery-leather-tote', 'Gallery Leather Tote', 'Morrow Studio', 'Accessories', 'Tote bag', 'Cognac', 210.00, 'A roomy leather tote with considered proportions for workdays and weekends.', 'cognac'),
  ('after-hours-blazer', 'After Hours Blazer', 'Northline', 'Outerwear', 'Blazer', 'Charcoal', 188.00, 'A softly tailored blazer that brings intention to the simplest look.', 'charcoal'),
  ('quiet-form-midi', 'Quiet Form Midi', 'Morrow Studio', 'Dresses', 'Midi dress', 'Clay', 176.00, 'A clean midi dress with a subtle waist and a confident, architectural line.', 'clay'),
  ('everyday-canvas-sneaker', 'Everyday Canvas Sneaker', 'Aster Row', 'Accessories', 'Sneakers', 'Ecru', 84.00, 'A low-profile canvas sneaker designed to ground your daily uniform.', 'ecru'),
  ('weekend-cropped-cardigan', 'Weekend Cropped Cardigan', 'Northline', 'Tops', 'Cardigan', 'Butter', 109.00, 'A compact cardigan with brushed softness and a warm, sunlit tone.', 'butter'),
  ('fluid-pleat-skirt', 'Fluid Pleat Skirt', 'Aster Row', 'Bottoms', 'Midi skirt', 'Moss', 132.00, 'Light-catching pleats move easily from desk hours to dinner plans.', 'moss'),
  ('foundations-rib-tank', 'Foundations Rib Tank', 'Northline', 'Tops', 'Tank top', 'Espresso', 58.00, 'A refined rib tank that layers beautifully and holds its shape all day.', 'espresso'),
  ('sculpted-shoulder-coat', 'Sculpted Shoulder Coat', 'Morrow Studio', 'Outerwear', 'Coat', 'Camel', 248.00, 'A longline coat with a sculpted shoulder and a warm brushed finish.', 'camel'),
  ('linework-slingback', 'Linework Slingback', 'Aster Row', 'Accessories', 'Slingback shoes', 'Burgundy', 156.00, 'A pointed slingback with a clean line and a low, walkable heel.', 'burgundy'),
  ('modern-utility-jacket', 'Modern Utility Jacket', 'Northline', 'Outerwear', 'Utility jacket', 'Olive', 154.00, 'A softly structured layer with practical pockets and a modern field-green tone.', 'olive'),
  ('dawn-column-skirt', 'Dawn Column Skirt', 'Morrow Studio', 'Bottoms', 'Column skirt', 'Rose', 128.00, 'A long column silhouette with a gentle rose tone and understated polish.', 'rose')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  color = EXCLUDED.color,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  visual_theme = EXCLUDED.visual_theme;