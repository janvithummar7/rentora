-- =====================================================================
-- SEED / SAMPLE DATA -- FOR DEVELOPMENT ONLY
-- Every row is flagged is_seed = true. Remove it all before launch with:
--     delete from public.clothing_listings where is_seed;
--     delete from public.users where is_seed;
-- Owner phone numbers below are FAKE. Replace one with your own WhatsApp
-- number (digits only, 10 digits) to test the WhatsApp flow end to end.
-- Images are local placeholders served from /public/placeholders.
-- =====================================================================

insert into public.users (id, name, mobile, whatsapp_number, city, area, is_seed) values
  ('11111111-1111-4111-8111-000000000001', 'Priya Shah',   '9000000001', '9000000001', 'Ahmedabad', 'Satellite',  true),
  ('11111111-1111-4111-8111-000000000002', 'Neha Patel',   '9000000002', '9000000002', 'Surat',     'Adajan',     true),
  ('11111111-1111-4111-8111-000000000003', 'Kavya Mehta',  '9000000003', '9000000003', 'Vadodara',  'Alkapuri',   true),
  ('11111111-1111-4111-8111-000000000004', 'Anjali Desai', '9000000004', '9000000004', 'Mumbai',    'Andheri',    true)
on conflict (id) do nothing;

insert into public.clothing_listings
  (owner_id, name, category, description, size, color, brand, condition, rent_price, security_deposit, location, city, available_from, available_to, status, is_seed)
select o.id, v.name, v.category, v.description, v.size, v.color, v.brand, v.condition,
       v.rent_price, v.security_deposit, v.area || ', ' || v.city, v.city,
       current_date, current_date + 365, 'approved', true
from (values
  -- Choli x5
  ('11111111-1111-4111-8111-000000000001', 'Designer Red Choli',        'choli', 'Heavy mirror-work red choli with embroidered border. Perfect for Navratri and garba nights.', 'M', 'Red',       'Kalki',        'Like new', 1500, 3000, 'Satellite', 'Ahmedabad'),
  ('11111111-1111-4111-8111-000000000001', 'Navratri Mirror Work Choli','choli', 'Colourful traditional chaniya choli with mirror and thread work. Comes with dupatta.',          'L', 'Multicolor','Local Boutique','Good',     1200, 2500, 'Satellite', 'Ahmedabad'),
  ('11111111-1111-4111-8111-000000000002', 'Royal Blue Silk Choli',     'choli', 'Rich royal blue silk choli with zari border. Ideal for weddings and festive evenings.',      'S', 'Blue',      'Meena Bazaar', 'Like new', 1800, 3500, 'Adajan',    'Surat'),
  ('11111111-1111-4111-8111-000000000003', 'Pink Bandhani Choli',       'choli', 'Hand-tied bandhani choli in soft pink. Light, comfortable and easy to dance in.',            'M', 'Pink',      null,           'Good',      900, 2000, 'Alkapuri',  'Vadodara'),
  ('11111111-1111-4111-8111-000000000004', 'Green Embroidered Choli',   'choli', 'Emerald green choli with gold embroidery. Pairs well with a plain lehenga or skirt.',        'L', 'Green',     'Fabindia',     'Good',     1000, 2000, 'Andheri',   'Mumbai'),
  -- Saree x3
  ('11111111-1111-4111-8111-000000000001', 'Kanjivaram Silk Saree',     'saree', 'Authentic Kanjivaram silk saree in maroon with gold zari. Blouse piece included.',            'Free Size', 'Maroon', 'Nalli',        'Like new', 2500, 6000, 'Satellite', 'Ahmedabad'),
  ('11111111-1111-4111-8111-000000000002', 'Georgette Party Saree',     'saree', 'Lightweight sequin georgette saree in champagne. Great for cocktail and reception nights.',   'Free Size', 'Champagne', null,        'Good',     1400, 3000, 'Adajan',    'Surat'),
  ('11111111-1111-4111-8111-000000000004', 'Banarasi Wedding Saree',    'saree', 'Classic Banarasi saree in deep green with traditional motifs.',                               'Free Size', 'Green', 'Local Weaver',  'Good',     2200, 5000, 'Andheri',   'Mumbai'),
  -- Kurti x3
  ('11111111-1111-4111-8111-000000000003', 'Chikankari Cotton Kurti',   'kurti', 'Soft white chikankari kurti, great for day functions and festive gatherings.',               'M', 'White',     'Biba',         'Like new',  500, 1000, 'Alkapuri',  'Vadodara'),
  ('11111111-1111-4111-8111-000000000002', 'Yellow Haldi Kurti Set',    'kurti', 'Bright yellow kurti with palazzo, popular for haldi ceremonies.',                            'L', 'Yellow',    'W',            'Good',      600, 1200, 'Adajan',    'Surat'),
  ('11111111-1111-4111-8111-000000000001', 'Printed Anarkali-Style Kurti','kurti','Flared printed kurti in teal with mirror detailing.',                                          'S', 'Teal',      'Global Desi',  'Good',      450,  900, 'Satellite', 'Ahmedabad'),
  -- Lehenga x2
  ('11111111-1111-4111-8111-000000000004', 'Bridal Pink Lehenga',       'lehenga','Heavy bridal-style pink lehenga with sequin and zardozi work. Dupatta included.',            'M', 'Pink',      'Anita Dongre', 'Like new', 4500, 10000,'Andheri',   'Mumbai'),
  ('11111111-1111-4111-8111-000000000001', 'Ivory Sangeet Lehenga',     'lehenga','Elegant ivory lehenga with pastel thread work, ideal for sangeet and engagement.',           'L', 'Ivory',     null,           'Good',     3000, 7000, 'Satellite', 'Ahmedabad'),
  -- Dress x2
  ('11111111-1111-4111-8111-000000000003', 'Black Cocktail Dress',      'dress', 'Knee-length black satin cocktail dress. Worn once.',                                          'S', 'Black',     'Zara',         'Like new',  900, 2000, 'Alkapuri',  'Vadodara'),
  ('11111111-1111-4111-8111-000000000002', 'Floral Maxi Dress',         'dress', 'Flowy floral maxi dress for brunches, vacations and photoshoots.',                            'M', 'Floral',    'H&M',          'Good',      700, 1500, 'Adajan',    'Surat'),
  -- Gown x2
  ('11111111-1111-4111-8111-000000000004', 'Wine Evening Gown',         'gown',  'Floor-length wine-coloured gown with a flattering silhouette and a back zip.',                'M', 'Wine',      null,           'Like new', 2000, 5000, 'Andheri',   'Mumbai'),
  ('11111111-1111-4111-8111-000000000001', 'Pastel Indo-Western Gown',  'gown',  'Pastel peach indo-western gown with a cape. Perfect for receptions and engagements.',         'L', 'Peach',     'Ritu Kumar',   'Good',     2400, 5500, 'Satellite', 'Ahmedabad')
) as v(owner_id, name, category, description, size, color, brand, condition, rent_price, security_deposit, area, city)
join public.users o on o.id = v.owner_id::uuid
where not exists (select 1 from public.clothing_listings x where x.is_seed and x.name = v.name);

insert into public.clothing_images (listing_id, image_url, is_primary)
select l.id, '/placeholders/' || l.category || '.svg', true
from public.clothing_listings l
where l.is_seed and not exists (select 1 from public.clothing_images i where i.listing_id = l.id);

insert into public.clothing_images (listing_id, image_url, is_primary)
select l.id, '/placeholders/' || l.category || '-2.svg', false
from public.clothing_listings l
where l.is_seed and not exists (
  select 1 from public.clothing_images i where i.listing_id = l.id and not i.is_primary);
