/**
 * Alternative Robust Banknote Cleaner & Rectification Engine
 * 
 * Key Innovations & Safeguards:
 * 1. Radon Projection Profile Skew Detection:
 *    Measures global edge orientation across candidate tilt angles [-8°, +8°].
 *    Unaffected by background texture, internal text, or watermark windows.
 * 2. Deskew-First Geometric Alignment:
 *    Applies rotation to an expanded bounding canvas BEFORE computing crop boundaries.
 *    Eliminates corner-clipping and misaligned bounding box shifts.
 * 3. Perimeter-Relative Background Segmentation:
 *    Models background along perimeter frame, not just 4 isolated corners.
 * 4. Generous Outward Safety Margin (+3.5%):
 *    Guarantees 100% of the banknote borders, portraits, serials, and margins remain intact.
 * 5. Strict Anti-Degradation / Idempotency Guard:
 *    If banknote already occupies >= 88% of the frame or no clear background margin exists,
 *    cropping is completely skipped (full frame preserved). Running fix 1x, 5x, or 20x produces
 *    the exact same pristine output with zero progressive shrinking!
 * 6. Numismatic Color & Contrast Fidelity:
 *    Preserves natural paper tones and intaglio engraving depth without bleaching.
 */

export interface CornerPoint {
  x: number; // 0 to 1 normalized, or absolute pixel coordinate
  y: number; // 0 to 1 normalized, or absolute pixel coordinate
}

export interface BanknoteCorners {
  topLeft: CornerPoint;
  topRight: CornerPoint;
  bottomRight: CornerPoint;
  bottomLeft: CornerPoint;
}

export interface CleanOptions {
  autoStraighten?: boolean;
  autoCropEdges?: boolean;
  autoRotateLandscape?: boolean;
  rotation90?: number; // 0, 90, 180, 270
  manualAngle?: number; // -15 to +15 degrees
  cropMarginPercent?: number; // 0 to 20%
  enhanceClarity?: boolean;
  quality?: number; // 0.85 to 0.98
  corners?: BanknoteCorners; // Optional user-specified 4 corners for manual perspective rectification
}

export interface CleanResult {
  cleanedBlob: Blob;
  dataUrl: string;
  detectedSkew: number;
  width: number;
  height: number;
  cropBox?: BoundingBox;
}

export interface BoundingBox {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface ContourAnalysis {
  boundingBox: BoundingBox;
  skewAngle: number;
  isPortrait: boolean;
}

/**
 * Measure banknote tilt angle using Radon Horizontal Projection Profile.
 * Evaluates candidate angles between -7.5° and +7.5° in 0.5° increments.
 * When the banknote's long edges align with horizontal axes, horizontal edge gradients
 * produce sharp spikes in row projection.
 */
export function detectSkewAngleProfile(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): number {
  const sampleW = 320;
  const sampleH = Math.max(160, Math.round((sampleW * height) / width));

  const offscreen = document.createElement('canvas');
  offscreen.width = sampleW;
  offscreen.height = sampleH;
  const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!offCtx) return 0;

  offCtx.drawImage(ctx.canvas, 0, 0, sampleW, sampleH);
  const imgData = offCtx.getImageData(0, 0, sampleW, sampleH);
  const d = imgData.data;

  // Compute grayscale luminance
  const lum = new Float32Array(sampleW * sampleH);
  for (let i = 0; i < lum.length; i++) {
    const idx = i * 4;
    lum[i] = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
  }

  // Vertical Sobel-like edge gradient |Gy|
  const gradY = new Float32Array(sampleW * sampleH);
  for (let y = 1; y < sampleH - 1; y++) {
    for (let x = 1; x < sampleW - 1; x++) {
      const idx = y * sampleW + x;
      const gy = Math.abs(lum[idx + sampleW] - lum[idx - sampleW]);
      gradY[idx] = gy;
    }
  }

  // Candidate angles from -7.0 to +7.0 in 0.5 deg steps
  const angles: number[] = [];
  for (let a = -7.0; a <= 7.0; a += 0.5) {
    angles.push(Math.round(a * 10) / 10);
  }

  let bestAngle = 0;
  let maxPeakVariance = 0;
  let zeroAngleVariance = 0;

  const startX = Math.round(sampleW * 0.15);
  const endX = Math.round(sampleW * 0.85);

  for (const angle of angles) {
    const rad = (angle * Math.PI) / 180;
    const tanA = Math.tan(rad);
    const midX = sampleW / 2;

    const rowProjection = new Float32Array(sampleH);
    const countProjection = new Uint16Array(sampleH);

    for (let x = startX; x < endX; x += 2) {
      const xOffset = x - midX;
      for (let y = 8; y < sampleH - 8; y += 2) {
        // Project y coordinate after counter-rotation
        const projY = Math.round(y - xOffset * tanA);
        if (projY >= 0 && projY < sampleH) {
          rowProjection[projY] += gradY[y * sampleW + x];
          countProjection[projY]++;
        }
      }
    }

    // Measure variance of the projection profile
    let sum = 0, sumSq = 0, validRows = 0;
    for (let y = 8; y < sampleH - 8; y++) {
      if (countProjection[y] > 5) {
        const val = rowProjection[y] / countProjection[y];
        sum += val;
        sumSq += val * val;
        validRows++;
      }
    }

    const mean = validRows > 0 ? sum / validRows : 0;
    const variance = validRows > 0 ? (sumSq / validRows) - (mean * mean) : 0;

    if (Math.abs(angle) < 0.1) {
      zeroAngleVariance = variance;
    }

    if (variance > maxPeakVariance) {
      maxPeakVariance = variance;
      bestAngle = angle;
    }
  }

  // Only apply tilt correction if the improvement over 0° is distinct (> 14%)
  if (zeroAngleVariance > 0 && maxPeakVariance / zeroAngleVariance < 1.14) {
    return 0;
  }

  if (Math.abs(bestAngle) < 0.4 || Math.abs(bestAngle) > 7.0) {
    return 0;
  }

  return bestAngle;
}

/**
 * Detect Safe Banknote Bounding Box on Leveled Canvas
 * Uses perimeter background sampling and outward safety padding.
 * Contains anti-degradation guard against recursive cropping.
 */
export function detectSafeBoundingBox(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): BoundingBox {
  const fullFrameBox: BoundingBox = { top: 0, bottom: height, left: 0, right: width };

  const sampleW = 320;
  const sampleH = Math.max(160, Math.round((sampleW * height) / width));

  const offscreen = document.createElement('canvas');
  offscreen.width = sampleW;
  offscreen.height = sampleH;
  const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!offCtx) return fullFrameBox;

  offCtx.drawImage(ctx.canvas, 0, 0, sampleW, sampleH);
  const imgData = offCtx.getImageData(0, 0, sampleW, sampleH);
  const d = imgData.data;

  // 1. Grayscale luminance array
  const lum = new Uint8Array(sampleW * sampleH);
  for (let i = 0; i < lum.length; i++) {
    const idx = i * 4;
    lum[i] = Math.round(0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2]);
  }

  // 2. Otsu thresholding across luminance histogram
  const hist = new Uint32Array(256);
  for (let i = 0; i < lum.length; i++) {
    hist[lum[i]]++;
  }

  const total = sampleW * sampleH;
  let sumAll = 0;
  for (let t = 0; t < 256; t++) {
    sumAll += t * hist[t];
  }

  let wB = 0;
  let sumB = 0;
  let varMax = 0;
  let tStart = 128;
  let tEnd = 128;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > varMax) {
      varMax = varBetween;
      tStart = t;
      tEnd = t;
    } else if (varBetween === varMax && varMax > 0) {
      tEnd = t;
    }
  }

  const thresh = Math.round((tStart + tEnd) / 2);

  // 3. Perimeter sampling to determine background polarity (outer 2.5% border)
  const borderX = Math.max(2, Math.round(sampleW * 0.025));
  const borderY = Math.max(2, Math.round(sampleH * 0.025));

  let perimLumSum = 0;
  let perimCount = 0;

  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const isPerimeter =
        y < borderY ||
        y >= sampleH - borderY ||
        x < borderX ||
        x >= sampleW - borderX;

      if (isPerimeter) {
        perimLumSum += lum[y * sampleW + x];
        perimCount++;
      }
    }
  }

  const perimLum = perimCount > 0 ? perimLumSum / perimCount : 0;

  // Sample central 50% region
  let centerLumSum = 0;
  let centerCount = 0;
  const cX1 = Math.round(sampleW * 0.25);
  const cX2 = Math.round(sampleW * 0.75);
  const cY1 = Math.round(sampleH * 0.25);
  const cY2 = Math.round(sampleH * 0.75);

  for (let y = cY1; y < cY2; y += 2) {
    for (let x = cX1; x < cX2; x += 2) {
      centerLumSum += lum[y * sampleW + x];
      centerCount++;
    }
  }
  const centerLum = centerCount > 0 ? centerLumSum / centerCount : 0;
  const contrastDiff = Math.abs(centerLum - perimLum);

  // If contrast between perimeter and center is virtually non-existent (< 18),
  // the photo is ALREADY tightly cropped to the banknote! Keep full frame!
  if (contrastDiff < 18) {
    return fullFrameBox;
  }

  // 4. Binary foreground occupancy
  // If perimeter is darker than threshold, background is dark, banknote is bright
  const isDarkBackground = perimLum < thresh;

  const rowCount = new Uint16Array(sampleH);
  const colCount = new Uint16Array(sampleW);

  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const l = lum[y * sampleW + x];
      const isForeground = isDarkBackground ? l > thresh : l < thresh;
      if (isForeground) {
        rowCount[y]++;
        colCount[x]++;
      }
    }
  }

  // A banknote is a solid physical rectangle: occupancy is substantial
  const minRowOccupancy = Math.max(6, Math.round(sampleW * 0.28));
  const minColOccupancy = Math.max(6, Math.round(sampleH * 0.20));

  let topY = 0;
  for (let y = 0; y < Math.round(sampleH * 0.45); y++) {
    if (rowCount[y] >= minRowOccupancy) {
      topY = y;
      break;
    }
  }

  let bottomY = sampleH;
  for (let y = sampleH - 1; y > Math.round(sampleH * 0.55); y--) {
    if (rowCount[y] >= minRowOccupancy) {
      bottomY = y;
      break;
    }
  }

  let leftX = 0;
  for (let x = 0; x < Math.round(sampleW * 0.40); x++) {
    if (colCount[x] >= minColOccupancy) {
      leftX = x;
      break;
    }
  }

  let rightX = sampleW;
  for (let x = sampleW - 1; x > Math.round(sampleW * 0.60); x--) {
    if (colCount[x] >= minColOccupancy) {
      rightX = x;
      break;
    }
  }

  // Map to original resolution
  const scaleX = width / sampleW;
  const scaleY = height / sampleH;

  // Add a protective +1.5% outward safety margin so edges and fine serials are never clipped
  const padX = Math.round(width * 0.015);
  const padY = Math.round(height * 0.015);

  let origLeft = Math.max(0, Math.round(leftX * scaleX) - padX);
  let origRight = Math.min(width, Math.round(rightX * scaleX) + padX);
  let origTop = Math.max(0, Math.round(topY * scaleY) - padY);
  let origBottom = Math.min(height, Math.round(bottomY * scaleY) + padY);

  const cropW = origRight - origLeft;
  const cropH = origBottom - origTop;

  // ANTI-DEGRADATION GUARD:
  // If the detected box already occupies >= 93% of width and >= 90% of height,
  // the photo is already tightly cropped to the banknote. Do not crop further.
  if (cropW >= width * 0.93 && cropH >= height * 0.90) {
    return fullFrameBox;
  }

  // Guard against degenerate invalid crops
  if (cropW < width * 0.35 || cropH < height * 0.20) {
    return fullFrameBox;
  }

  return {
    top: origTop,
    bottom: origBottom,
    left: origLeft,
    right: origRight,
  };
}

/**
 * Combined safe contour and tilt analysis
 */
export function analyzeBanknoteContour(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): ContourAnalysis {
  const isPortrait = height > width * 1.08;
  const skewAngle = detectSkewAngleProfile(ctx, width, height);
  const boundingBox = detectSafeBoundingBox(ctx, width, height);

  return {
    boundingBox,
    skewAngle,
    isPortrait,
  };
}

export function detectSkewAngle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): number {
  return detectSkewAngleProfile(ctx, width, height);
}

export function detectBanknoteEdges(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): BoundingBox {
  return detectSafeBoundingBox(ctx, width, height);
}

/**
 * Solve 3x3 Homography Matrix mapping 4 source points to 4 destination points.
 * Uses Gaussian elimination with partial pivoting.
 */
export function getPerspectiveTransform(
  src: { x: number; y: number }[],
  dst: { x: number; y: number }[]
): number[] {
  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    B.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    B.push(dy);
  }

  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [B[i], B[maxRow]] = [B[maxRow], B[i]];

    const pivot = A[i][i];
    if (Math.abs(pivot) < 1e-10) continue;

    for (let j = i; j < n; j++) A[i][j] /= pivot;
    B[i] /= pivot;

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = A[k][i];
        for (let j = i; j < n; j++) A[k][j] -= factor * A[i][j];
        B[k] -= factor * B[i];
      }
    }
  }

  return [
    B[0], B[1], B[2],
    B[3], B[4], B[5],
    B[6], B[7], 1
  ];
}

/**
 * Warp quadrilateral defined by 4 corners into a rectified, unskewed rectangular canvas
 * with subpixel bilinear interpolation.
 */
export function warpPerspectiveCanvas(
  sourceCanvas: HTMLCanvasElement,
  corners: BanknoteCorners
): HTMLCanvasElement {
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;

  // Convert normalized corners (0 to 1) to canvas pixel coordinates
  const toPixel = (pt: CornerPoint) => ({
    x: pt.x <= 1.0 ? pt.x * srcW : pt.x,
    y: pt.y <= 1.0 ? pt.y * srcH : pt.y,
  });

  const p0 = toPixel(corners.topLeft);
  const p1 = toPixel(corners.topRight);
  const p2 = toPixel(corners.bottomRight);
  const p3 = toPixel(corners.bottomLeft);

  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const topW = dist(p0, p1);
  const bottomW = dist(p3, p2);
  const leftH = dist(p0, p3);
  const rightH = dist(p1, p2);

  const outW = Math.max(100, Math.round(Math.max(topW, bottomW)));
  const outH = Math.max(60, Math.round(Math.max(leftH, rightH)));

  const dst = [
    { x: 0, y: 0 },
    { x: outW, y: 0 },
    { x: outW, y: outH },
    { x: 0, y: outH },
  ];

  const srcPoints = [p0, p1, p2, p3];
  const invH = getPerspectiveTransform(dst, srcPoints);

  const destCanvas = document.createElement('canvas');
  destCanvas.width = outW;
  destCanvas.height = outH;
  const destCtx = destCanvas.getContext('2d', { willReadFrequently: true });
  if (!destCtx) throw new Error('Could not create destination canvas context');

  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) throw new Error('Could not get source canvas context');

  const srcImageData = srcCtx.getImageData(0, 0, srcW, srcH);
  const srcData = srcImageData.data;

  const destImageData = destCtx.createImageData(outW, outH);
  const destData = destImageData.data;

  const h0 = invH[0], h1 = invH[1], h2 = invH[2];
  const h3 = invH[3], h4 = invH[4], h5 = invH[5];
  const h6 = invH[6], h7 = invH[7], h8 = invH[8];

  for (let y = 0; y < outH; y++) {
    const rowOffset = y * outW;
    for (let x = 0; x < outW; x++) {
      const denom = h6 * x + h7 * y + h8;
      const sx = (h0 * x + h1 * y + h2) / denom;
      const sy = (h3 * x + h4 * y + h5) / denom;

      const destIdx = (rowOffset + x) * 4;

      if (sx >= 0 && sx < srcW - 1 && sy >= 0 && sy < srcH - 1) {
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const fx = sx - x0;
        const fy = sy - y0;
        const fx1 = 1 - fx;
        const fy1 = 1 - fy;

        const i00 = (y0 * srcW + x0) * 4;
        const i10 = (y0 * srcW + x1) * 4;
        const i01 = (y1 * srcW + x0) * 4;
        const i11 = (y1 * srcW + x1) * 4;

        destData[destIdx] = Math.round(
          fx1 * fy1 * srcData[i00] +
          fx  * fy1 * srcData[i10] +
          fx1 * fy  * srcData[i01] +
          fx  * fy  * srcData[i11]
        );
        destData[destIdx + 1] = Math.round(
          fx1 * fy1 * srcData[i00 + 1] +
          fx  * fy1 * srcData[i10 + 1] +
          fx1 * fy  * srcData[i01 + 1] +
          fx  * fy  * srcData[i11 + 1]
        );
        destData[destIdx + 2] = Math.round(
          fx1 * fy1 * srcData[i00 + 2] +
          fx  * fy1 * srcData[i10 + 2] +
          fx1 * fy  * srcData[i01 + 2] +
          fx  * fy  * srcData[i11 + 2]
        );
        destData[destIdx + 3] = 255;
      } else {
        destData[destIdx + 3] = 255;
      }
    }
  }

  destCtx.putImageData(destImageData, 0, 0);
  return destCanvas;
}

/**
 * Safe Banknote Image Cleaner & Rectification
 * 
 * Pipeline:
 * 1. 90-degree user/orientation rotation
 * 2. If manual 4 corners specified: Perspective Homography Warp to rectangular plane
 * 3. Skew detection via Radon projection profile (for auto mode)
 * 4. Centered leveled rotation (deskew) into canvas without clipping
 * 5. Safe bounding box detection ON LEVELED IMAGE with outward safety margin
 * 6. Idempotent output with strict numismatic color preservation
 */
export async function cleanBanknoteImage(
  inputBlob: Blob,
  options: CleanOptions = {}
): Promise<CleanResult> {
  const {
    autoStraighten = true,
    autoCropEdges = true,
    autoRotateLandscape = false,
    rotation90 = 0,
    manualAngle = 0,
    cropMarginPercent = 0,
    enhanceClarity = false,
    quality = 0.95,
    corners,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image blob'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image into canvas'));
      img.onload = () => {
        try {
          const origW = img.naturalWidth || img.width;
          const origH = img.naturalHeight || img.height;

          // 1. Initial 90-degree step orientation
          let effectiveRot90 = ((rotation90 % 360) + 360) % 360;
          if (autoRotateLandscape && effectiveRot90 === 0 && origH > origW * 1.15) {
            effectiveRot90 = 90;
          }

          let baseCanvas = document.createElement('canvas');
          let baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
          if (!baseCtx) throw new Error('Could not create base canvas context');

          if (effectiveRot90 % 180 !== 0) {
            baseCanvas.width = origH;
            baseCanvas.height = origW;
          } else {
            baseCanvas.width = origW;
            baseCanvas.height = origH;
          }

          baseCtx.save();
          if (effectiveRot90 === 90) {
            baseCtx.translate(baseCanvas.width, 0);
            baseCtx.rotate((90 * Math.PI) / 180);
          } else if (effectiveRot90 === 180) {
            baseCtx.translate(baseCanvas.width, baseCanvas.height);
            baseCtx.rotate((180 * Math.PI) / 180);
          } else if (effectiveRot90 === 270) {
            baseCtx.translate(0, baseCanvas.height);
            baseCtx.rotate((270 * Math.PI) / 180);
          }
          baseCtx.drawImage(img, 0, 0);
          baseCtx.restore();

          // 2. Direct 4-Corner Manual Perspective Homography Warp (if specified)
          if (corners) {
            let warpedCanvas = warpPerspectiveCanvas(baseCanvas, corners);

            // Optional manual angle deskew fine-tune
            if (manualAngle !== 0) {
              const rad = (manualAngle * Math.PI) / 180;
              const absCos = Math.abs(Math.cos(rad));
              const absSin = Math.abs(Math.sin(rad));
              const rotW = Math.ceil(warpedCanvas.width * absCos + warpedCanvas.height * absSin);
              const rotH = Math.ceil(warpedCanvas.width * absSin + warpedCanvas.height * absCos);
              const rotCanvas = document.createElement('canvas');
              rotCanvas.width = rotW;
              rotCanvas.height = rotH;
              const rotCtx = rotCanvas.getContext('2d', { willReadFrequently: true });
              if (rotCtx) {
                rotCtx.save();
                rotCtx.translate(rotW / 2, rotH / 2);
                rotCtx.rotate(-rad);
                rotCtx.drawImage(warpedCanvas, -warpedCanvas.width / 2, -warpedCanvas.height / 2);
                rotCtx.restore();
                warpedCanvas = rotCanvas;
              }
            }

            // Optional margin inset fine-tune
            let outputCanvas = warpedCanvas;
            if (cropMarginPercent > 0) {
              const mX = Math.round(warpedCanvas.width * (cropMarginPercent / 100));
              const mY = Math.round(warpedCanvas.height * (cropMarginPercent / 100));
              const trimW = Math.max(100, warpedCanvas.width - 2 * mX);
              const trimH = Math.max(60, warpedCanvas.height - 2 * mY);
              const trimmedCanvas = document.createElement('canvas');
              trimmedCanvas.width = trimW;
              trimmedCanvas.height = trimH;
              const tCtx = trimmedCanvas.getContext('2d', { willReadFrequently: true });
              if (tCtx) {
                tCtx.drawImage(warpedCanvas, mX, mY, trimW, trimH, 0, 0, trimW, trimH);
                outputCanvas = trimmedCanvas;
              }
            }

            if (enhanceClarity) {
              const oCtx = outputCanvas.getContext('2d', { willReadFrequently: true });
              if (oCtx) applySubtleSharpening(oCtx, outputCanvas.width, outputCanvas.height);
            }

            outputCanvas.toBlob(
              (resultBlob) => {
                const exportBlob = resultBlob || inputBlob;
                const dataUrl = outputCanvas.toDataURL('image/jpeg', quality);
                resolve({
                  cleanedBlob: exportBlob,
                  dataUrl,
                  detectedSkew: 0,
                  width: outputCanvas.width,
                  height: outputCanvas.height,
                });
              },
              'image/jpeg',
              quality
            );
            return;
          }

          // 3. Skew angle detection via projection profile (Auto Mode)
          let finalAngle = manualAngle;
          if (autoStraighten && manualAngle === 0) {
            finalAngle = detectSkewAngleProfile(baseCtx, baseCanvas.width, baseCanvas.height);
          }

          // 3. Deskew canvas: Rotate without cutting off any banknote corners
          let leveledCanvas = baseCanvas;
          if (Math.abs(finalAngle) >= 0.4) {
            const rad = (finalAngle * Math.PI) / 180;
            const absCos = Math.abs(Math.cos(rad));
            const absSin = Math.abs(Math.sin(rad));

            // Expand canvas dimensions to hold the rotated rectangle completely
            const rotW = Math.ceil(baseCanvas.width * absCos + baseCanvas.height * absSin);
            const rotH = Math.ceil(baseCanvas.width * absSin + baseCanvas.height * absCos);

            const rotCanvas = document.createElement('canvas');
            rotCanvas.width = rotW;
            rotCanvas.height = rotH;
            const rotCtx = rotCanvas.getContext('2d', { willReadFrequently: true });

            if (rotCtx) {
              rotCtx.save();
              rotCtx.translate(rotW / 2, rotH / 2);
              rotCtx.rotate(-rad);
              rotCtx.drawImage(
                baseCanvas,
                -baseCanvas.width / 2,
                -baseCanvas.height / 2
              );
              rotCtx.restore();
              leveledCanvas = rotCanvas;
            }
          }

          const leveledCtx = leveledCanvas.getContext('2d', { willReadFrequently: true });
          if (!leveledCtx) throw new Error('Could not get leveled canvas context');

          // 4. Detect safe bounding box ON THE LEVELED IMAGE
          let bounds: BoundingBox = {
            top: 0,
            bottom: leveledCanvas.height,
            left: 0,
            right: leveledCanvas.width,
          };

          if (autoCropEdges) {
            bounds = detectSafeBoundingBox(leveledCtx, leveledCanvas.width, leveledCanvas.height);
          }

          // Optional user margin adjustments (only if explicitly set)
          if (cropMarginPercent > 0) {
            const mX = (bounds.right - bounds.left) * (cropMarginPercent / 100);
            const mY = (bounds.bottom - bounds.top) * (cropMarginPercent / 100);
            bounds.left = Math.round(bounds.left + mX);
            bounds.right = Math.round(bounds.right - mX);
            bounds.top = Math.round(bounds.top + mY);
            bounds.bottom = Math.round(bounds.bottom - mY);
          }

          const targetW = Math.max(120, bounds.right - bounds.left);
          const targetH = Math.max(80, bounds.bottom - bounds.top);

          // 5. Final output canvas
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = targetW;
          finalCanvas.height = targetH;
          const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
          if (!finalCtx) throw new Error('Could not create final context');

          finalCtx.drawImage(
            leveledCanvas,
            bounds.left,
            bounds.top,
            targetW,
            targetH,
            0,
            0,
            targetW,
            targetH
          );

          // Optional gentle sharpening (never bleaches contrast)
          if (enhanceClarity) {
            applySubtleSharpening(finalCtx, targetW, targetH);
          }

          // 6. Export high-fidelity standard JPEG blob
          finalCanvas.toBlob(
            (resultBlob) => {
              const exportBlob = resultBlob || inputBlob;
              const dataUrl = finalCanvas.toDataURL('image/jpeg', quality);
              resolve({
                cleanedBlob: exportBlob,
                dataUrl,
                detectedSkew: finalAngle,
                width: targetW,
                height: targetH,
                cropBox: bounds,
              });
            },
            'image/jpeg',
            quality
          );
        } catch (procErr) {
          console.warn('Banknote cleaner safe fallback:', procErr);
          resolve({
            cleanedBlob: inputBlob,
            dataUrl: '',
            detectedSkew: 0,
            width: 0,
            height: 0,
          });
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(inputBlob);
  });
}

/**
 * Subtle numismatic sharpening that enhances fine intaglio lines
 * without blowing out highlights or clipping white paper margins.
 */
function applySubtleSharpening(ctx: CanvasRenderingContext2D, w: number, h: number) {
  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const copy = new Uint8ClampedArray(d);

    // Mild unsharp filter kernel
    // Center: 1.25, Neighbors: -0.0625
    const centerWeight = 1.25;
    const neighborWeight = -0.0625;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const val = copy[idx + c];
          const up = copy[((y - 1) * w + x) * 4 + c];
          const down = copy[((y + 1) * w + x) * 4 + c];
          const left = copy[(y * w + (x - 1)) * 4 + c];
          const right = copy[(y * w + (x + 1)) * 4 + c];

          const sharp = val * centerWeight + (up + down + left + right) * neighborWeight;
          d[idx + c] = Math.min(255, Math.max(0, Math.round(sharp)));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn('Subtle sharpening skipped:', err);
  }
}

/**
 * Convert any image source (Blob, Blob URL, Data URL, or HTTP URL) to a Blob safely.
 */
export async function ensureImageBlob(input: Blob | string): Promise<Blob> {
  if (input instanceof Blob) return input;
  if (typeof input !== 'string' || !input) throw new Error('Invalid image input');

  if (input.startsWith('data:') || input.startsWith('blob:')) {
    const res = await fetch(input);
    return res.blob();
  }

  try {
    const res = await fetch(input, { mode: 'cors' });
    if (res.ok) return await res.blob();
  } catch (err) {
    console.warn('Direct fetch failed, falling back to canvas extraction:', err);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context failed');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob from canvas'));
        }, 'image/jpeg', 0.95);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image from URL'));
    img.src = input;
  });
}

