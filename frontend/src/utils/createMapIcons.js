
export const createCircleIcon = (color = "#3388ff") => {
      const derivedColors = deriveMarkerColors(color);

      const gradientId = `grad-${crypto.randomUUID()}`;

      return L.divIcon({
        className: "custom-circle-icon",
        html: `
        <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="${gradientId}">
              <stop offset="0%" stop-color="${derivedColors[0]}" />
              <stop offset="100%" stop-color="${derivedColors[1]}" />
            </linearGradient>
          </defs>
          <circle r="45" cx="50" cy="50" fill="url(#${gradientId})" stroke="${derivedColors[1]}" stroke-width="8" />
        </svg>
        `,
        iconSize: [40, 40],
        iconAnchor: [10.5, 10]
      });
    }

export const createPinIcon = (color = "#4C9CD1") => {
      const derivedColors = deriveMarkerColors(color);

      const gradientId = `gradient-${crypto.randomUUID()}`;
      const strokeId = `stroke-${crypto.randomUUID()}`;

      return L.divIcon({
        className: "custom-pin-icon",
        html: `
            <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round" viewBox="0 0 500 820"><defs>
            <linearGradient id="${gradientId}" x1="0" x2="1" y1="0" y2="0" gradientTransform="rotate(-90 478.727 62.272)scale(37.566)" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="${derivedColors[3]}"/><stop offset="1" stop-color="${derivedColors[0]}"/>
            </linearGradient>
            <linearGradient id="${strokeId}" x1="0" x2="1" y1="0" y2="0" gradientTransform="rotate(-90 468.484 54.002)scale(19.053)" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="${derivedColors[2]}"/><stop offset="1" stop-color="${derivedColors[1]}"/></linearGradient></defs>
            <path fill="#FFF" d="M341.864 266.306c0 50.809-41.038 91.846-91.846 91.846s-91.846-41.037-91.846-91.846c0-50.808
            41.038-91.846 91.846-91.846s91.846 41.038 91.846 91.846"/><path fill="url(#${gradientId})" stroke="url(#${strokeId})" stroke-width="1.1"
            d="M416.544 503.612c-6.573 0-12.044 5.691-12.044 11.866 0 2.778 1.564 6.308 2.694 8.746l9.306 17.872 9.262-17.872c1.13-2.438 2.738-5.791
            2.738-8.746 0-6.175-5.383-11.866-11.956-11.866Zm0 7.155a4.714 4.714 0 0 1 4.679 4.71c0 2.588-2.095 4.663-4.679
            4.679-2.584-.017-4.679-2.09-4.679-4.679a4.714 4.714 0 0 1 4.679-4.71Z" transform="translate(-7889.1 -9807.44)scale(19.5417)"/>
            </svg>
        `,
        iconSize: [24, 38],
        shadowUrl: "/src/images/marker-shadow.svg",
        shadowSize: [40, 40],
        shadowAnchor: [13, 21]
      });
    }

export const rgbToHex = (rgb) => {
        for (var i = 0; i < rgb.length; i++) {
          if (rgb[i] < 0) {rgb[i] = 0}
          else if (rgb[i] > 255) {rgb[i] = 255}
        }
        var r = rgb[0].toString(16).toUpperCase();
        var g = rgb[1].toString(16).toUpperCase();
        var b = rgb[2].toString(16).toUpperCase();

        if (r.length < 2) {r = "0" + r}
        if (g.length < 2) {g = "0" + g}
        if (b.length < 2) {b = "0" + b}

        return ("#" + r + g + b);
    }

export const deriveMarkerColors = (color) => {
        var colorInt = parseInt(color.slice(1), 16);
        var r = (colorInt >> 16) & 255;
        var g = (colorInt >> 8) & 255;
        var b = colorInt & 255;
        console.log(r, g, b);

        var baseColor = color;
        var secondaryColorLighter = rgbToHex([r - 20, g - 25, b - 26]);
        var secondaryColorDarker = rgbToHex([r - 30, g - 48, b - 58]);
        var colorGradient = rgbToHex([r - 58, g - 45, b - 11]);

        return([baseColor, secondaryColorLighter, secondaryColorDarker, colorGradient]);
    }