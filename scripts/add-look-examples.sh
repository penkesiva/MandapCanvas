#!/bin/bash
# Copies the groom, couple and venue before/after example photos from ~/Downloads into public/samples,
# resized to 900px tall JPEGs. The rotating examples on /looks and the home page show any pair
# whose two photos exist.
#
# Save the four images to ~/Downloads with these names (any of .png .jpg .jpeg .webp):
#   groom-before   groom-after   couple-before   couple-after
#   venue-before   venue-after   venue-backyard-before   venue-backyard-after
#
# Then run from the project folder:  bash scripts/add-look-examples.sh
set -e
cd "$(dirname "$0")/.."
SRC="${1:-$HOME/Downloads}"
OUT="public/samples"

find_src() {
  for ext in png jpg jpeg webp PNG JPG JPEG WEBP; do
    [ -f "$SRC/$1.$ext" ] && { echo "$SRC/$1.$ext"; return; }
  done
}

added=0
for name in groom-before groom-after couple-before couple-after venue-before venue-after venue-backyard-before venue-backyard-after; do
  f=$(find_src "$name")
  if [ -z "$f" ]; then
    echo "missing: $SRC/$name.(png|jpg|webp)"
    continue
  fi
  case "$name" in venue-*) dest="$OUT/$name.jpg" ;; *) dest="$OUT/look-$name.jpg" ;; esac
  sips -s format jpeg -s formatOptions 82 --resampleHeight 900 "$f" --out "$dest" >/dev/null
  echo "added:   $dest"
  added=$((added + 1))
done
echo "$added photos added."
