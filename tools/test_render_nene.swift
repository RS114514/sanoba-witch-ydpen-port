import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let fgDir = "/Volumes/500GB/sanoba_witch_assets/characters/fgimage/１－寧々"
let outDir = "/Volumes/500GB/sanoba-witch-ydpen-port/build_assets/fg"
try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)

struct LayerItem {
    let id: String
    let x: Int
    let y: Int
    let w: Int
    let h: Int
}

func compositeLayers(layers: [LayerItem], outName: String) {
    let canvasW = 1875
    let canvasH = 2656
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(data: nil, width: canvasW, height: canvasH, bitsPerComponent: 8, bytesPerRow: canvasW * 4, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
        print("Failed to create context")
        return
    }

    for lay in layers {
        let p = "\(fgDir)/寧々a_0_\(lay.id).tlg"
        let url = URL(fileURLWithPath: p)
        guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
              let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else {
            print("Failed to read \(p)")
            continue
        }
        let rect = CGRect(x: lay.x, y: canvasH - lay.y - lay.h, width: lay.w, height: lay.h)
        ctx.draw(img, in: rect)
    }

    guard let fullImg = ctx.makeImage() else { return }

    // 针对词典笔舞台 (780x440) 裁切半身像，聚焦人物胸像到头部
    // 宁宁头部在 top: 850~1000 左右，身体在 top: 760~2400
    let cropRect = CGRect(x: 450, y: 700, width: 950, height: 1200)
    guard let cropped = fullImg.cropping(to: cropRect) else { return }

    let stageW = 780
    let stageH = 440
    guard let outCtx = CGContext(data: nil, width: stageW, height: stageH, bitsPerComponent: 8, bytesPerRow: stageW * 4, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return }
    outCtx.interpolationQuality = .high

    let scale = Double(stageH) / Double(cropRect.height)
    let drawW = Double(cropRect.width) * scale
    let drawH = Double(stageH)
    let drawX = (Double(stageW) - drawW) / 2.0
    outCtx.draw(cropped, in: CGRect(x: drawX, y: 0, width: drawW, height: drawH))

    guard let finalImg = outCtx.makeImage() else { return }
    let outUrl = URL(fileURLWithPath: "\(outDir)/\(outName).png")
    guard let dest = CGImageDestinationCreateWithURL(outUrl as CFURL, UTType.png.identifier as CFString, 1, nil) else { return }
    CGImageDestinationAddImage(dest, finalImg, nil)
    CGImageDestinationFinalize(dest)
    print("Exported \(outName).png successfully!")
}

// 1. 宁宁制服日常
compositeLayers(layers: [
    LayerItem(id: "1316", x: 570, y: 767, w: 688, h: 1712), // 制服
    LayerItem(id: "2399", x: 808, y: 901, w: 177, h: 126),  // 基础表情
    LayerItem(id: "3140", x: 810, y: 922, w: 183, h: 88)    // 前发
], outName: "寧々_制服_01")

// 2. 宁宁制服笑容
compositeLayers(layers: [
    LayerItem(id: "1316", x: 570, y: 767, w: 688, h: 1712), // 制服
    LayerItem(id: "2855", x: 812, y: 905, w: 170, h: 122),  // 笑容表情
    LayerItem(id: "3140", x: 810, y: 922, w: 183, h: 88)    // 前发
], outName: "寧々_制服_02")

// 3. 宁宁私服
compositeLayers(layers: [
    LayerItem(id: "1314", x: 690, y: 767, w: 536, h: 1715), // 私服
    LayerItem(id: "2399", x: 808, y: 901, w: 177, h: 126),  // 基础表情
    LayerItem(id: "3140", x: 810, y: 922, w: 183, h: 88)    // 前发
], outName: "寧々_私服_01")

// 4. 宁宁魔女服
compositeLayers(layers: [
    LayerItem(id: "1293", x: 523, y: 622, w: 869, h: 1861), // 魔女服
    LayerItem(id: "2399", x: 808, y: 901, w: 177, h: 126),  // 基础表情
    LayerItem(id: "1743", x: 810, y: 919, w: 187, h: 85)    // 魔女服前发
], outName: "寧々_魔女服_01")
