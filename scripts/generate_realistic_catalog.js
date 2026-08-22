const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -------------------------------------------------------------
// 1. ALL BRANDS ACROSS TECH, APPLIANCES, FASHION, BEAUTY, HOME
// -------------------------------------------------------------
const BRANDS_DATA = [
  // Tech & Electronics
  ["Apple", "apple", "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300", "Thương hiệu công nghệ hàng đầu thế giới từ Mỹ với hệ sinh thái iPhone, iPad, Mac", "Mỹ"],
  ["Samsung", "samsung", "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300", "Tập đoàn công nghệ điện tử hàng đầu Hàn Quốc nổi tiếng dòng Galaxy", "Hàn Quốc"],
  ["Xiaomi", "xiaomi", "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300", "Tập đoàn công nghệ sản xuất thiết bị thông minh giá tốt và hiệu năng cao", "Trung Quốc"],
  ["ASUS", "asus", "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300", "Thương hiệu máy tính, laptop văn phòng Zenbook và gaming ROG nổi tiếng", "Đài Loan"],
  ["Dell", "dell", "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300", "Tập đoàn công nghệ máy tính uy tín số 1 thế giới với dòng XPS và Latitude", "Mỹ"],
  ["Sony", "sony", "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300", "Thương hiệu âm thanh tai nghe chống ồn WH-1000XM và điện thoại Xperia", "Nhật Bản"],
  ["LG", "lg", "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=300", "Thương hiệu màn hình OLED, máy giặt và gia dụng thông minh cao cấp", "Hàn Quốc"],

  // Home Appliances (Gia dụng)
  ["Philips", "philips", "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=300", "Thương hiệu điện gia dụng, nồi chiên không dầu và bàn ủi hàng đầu Hà Lan", "Hà Lan"],
  ["Panasonic", "panasonic", "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=300", "Tập đoàn điện tử gia dụng và thiết bị chăm sóc gia đình uy tín Nhật Bản", "Nhật Bản"],
  ["Tefal", "tefal", "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=300", "Thương hiệu thiết bị nhà bếp, chảo chống dính và nồi chiên số 1 của Pháp", "Pháp"],
  ["Lock&Lock", "lock-lock", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300", "Thương hiệu đồ gia dụng, hộp bảo quản và bình giữ nhiệt hàng đầu Hàn Quốc", "Hàn Quốc"],
  ["Sunhouse", "sunhouse", "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=300", "Tập đoàn gia dụng hàng đầu Việt Nam với chất lượng bền bỉ và giá cả hợp lý", "Việt Nam"],

  // Men's Fashion (Thời trang Nam)
  ["Coolmate", "coolmate", "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300", "Thương hiệu thời trang nam phong cách tối giản, thoáng khí và thân thiện", "Việt Nam"],
  ["Routine", "routine", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300", "Thương hiệu thời trang nam trẻ trung, phong cách hiện đại và chuẩn form", "Việt Nam"],
  ["An Phước", "an-phuoc", "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300", "Thương hiệu áo sơ mi, quần tây công sở cao cấp chuẩn phong thái quý ông", "Việt Nam"],
  ["Uniqlo", "uniqlo", "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300", "Thương hiệu thời trang LifeWear hàng đầu Nhật Bản với công nghệ AIRism và Heattech", "Nhật Bản"],

  // Women's Fashion (Thời trang Nữ)
  ["Elise", "elise", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300", "Thương hiệu thời trang nữ cao cấp, thanh lịch và dẫn đầu xu hướng đầm công sở", "Việt Nam"],
  ["IVY moda", "ivy-moda", "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300", "Thương hiệu thời trang xu hướng nữ tính, thanh lịch và đẳng cấp", "Việt Nam"],
  ["Gumac", "gumac", "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300", "Thương hiệu đầm váy công sở nữ thanh lịch với giá thành dễ tiếp cận", "Việt Nam"],
  ["Zara", "zara", "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300", "Tập đoàn thời trang nhanh hàng đầu thế giới từ Tây Ban Nha", "Tây Ban Nha"],

  // Beauty & Skincare (Mỹ phẩm)
  ["La Roche-Posay", "la-roche-posay", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300", "Dược mỹ phẩm hàng đầu Pháp chuyên biệt chăm sóc và phục hồi cho làn da nhạy cảm", "Pháp"],
  ["L'Oreal Paris", "loreal-paris", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300", "Tập đoàn mỹ phẩm & chăm sóc sắc đẹp số 1 thế giới với công nghệ dưỡng chất chuyên sâu", "Pháp"],
  ["Cocoon", "cocoon", "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300", "Thương hiệu mỹ phẩm thuần chay 100% từ nguyên liệu thiên nhiên thuần khiết Việt Nam", "Việt Nam"],
  ["Innisfree", "innisfree", "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300", "Thương hiệu mỹ phẩm dưỡng da chiết xuất trà xanh và tro núi lửa từ đảo Jeju Hàn Quốc", "Hàn Quốc"],
  ["Paula's Choice", "paulas-choice", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300", "Dược mỹ phẩm danh tiếng từ Mỹ nổi tiếng với hoạt chất BHA và Niacinamide", "Mỹ"],

  // Home & Living (Nhà cửa & Đời sống)
  ["IKEA", "ikea", "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300", "Tập đoàn nội thất và vật dụng gia đình thông minh số 1 Thụy Điển", "Thụy Điển"],
  ["Inochi", "inochi", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300", "Thương hiệu gia dụng cao cấp theo phong cách và tiêu chuẩn chất lượng Nhật Bản", "Việt Nam"],
  ["Rạng Đông", "rang-dong", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300", "Thương hiệu đèn chiếu sáng LED và thiết bị điện thông minh uy tín số 1 Việt Nam", "Việt Nam"]
];

// -------------------------------------------------------------
// 2. CATEGORIES TREE (MATCHING NAVBAR EXACT SLUGS)
// -------------------------------------------------------------
const CATEGORIES_TREE = [
  {
    name: "Điện thoại & Máy tính bảng",
    slug: "dien-thoai-may-tinh-bang",
    icon: "Smartphone",
    subs: [
      ["Điện thoại Smartphone", "dien-thoai-smartphone"],
      ["Máy tính bảng Tablet", "may-tinh-bang-tablet"],
      ["Đồng hồ thông minh Smartwatch", "dong-ho-thong-minh"],
      ["Phụ kiện điện thoại", "phu-kien-dien-thoai"]
    ]
  },
  {
    name: "Laptop & Máy tính",
    slug: "laptop-may-tinh",
    icon: "Laptop",
    subs: [
      ["Laptop Văn phòng", "laptop-van-phong"],
      ["Laptop Gaming", "laptop-gaming"],
      ["Màn hình máy tính", "man-hinh-may-tinh"],
      ["Bàn phím & Chuột", "ban-phim-chuot"]
    ]
  },
  {
    name: "Thiết bị số & Âm thanh",
    slug: "thiet-bi-so-am-thanh",
    icon: "Headphones",
    subs: [
      ["Tai nghe Bluetooth", "tai-nghe-bluetooth"],
      ["Loa di động Bluetooth", "loa-di-dong-bluetooth"],
      ["Sạc dự phòng & Cáp sạc", "sac-du-phong"]
    ]
  },
  {
    name: "Điện lạnh & Gia dụng",
    slug: "dien-lanh-gia-dung",
    icon: "Tv",
    subs: [
      ["Nồi chiên không dầu", "noi-chien-khong-dau"],
      ["Robot hút bụi thông minh", "robot-hut-bui"],
      ["Nồi cơm điện cao tần", "noi-com-dien"],
      ["Máy lọc không khí", "may-loc-khong-khi"],
      ["Máy xay sinh tố & ép chậm", "may-xay-sinh-to"],
      ["Bàn ủi hơi nước cầm tay", "ban-ui-hoi-nuoc"]
    ]
  },
  {
    name: "Thời trang Nam",
    slug: "thoi-trang-nam",
    icon: "Shirt",
    subs: [
      ["Áo thun & Áo Polo nam", "ao-thun-nam"],
      ["Áo sơ mi nam công sở", "ao-so-mi-nam"],
      ["Quần Jeans & Kaki nam", "quan-jeans-nam"],
      ["Quần tây nam cao cấp", "quan-tay-nam"],
      ["Áo khoác nam thời trang", "ao-khoac-nam"]
    ]
  },
  {
    name: "Thời trang Nữ",
    slug: "thoi-trang-nu",
    icon: "Sparkles",
    subs: [
      ["Váy đầm công sở & Dạo phố", "vay-dam-nu"],
      ["Áo kiểu & Sơ mi nữ", "ao-kieu-nu"],
      ["Chân váy & Quần suông nữ", "chan-vay-nu"],
      ["Áo khoác Blazer nữ", "ao-blazer-nu"],
      ["Túi xách & Ví nữ", "tui-xach-nu"]
    ]
  },
  {
    name: "Mỹ phẩm & Chăm sóc cá nhân",
    slug: "my-pham-cham-soc-ca-nhan",
    icon: "Heart",
    subs: [
      ["Kem chống nắng bảo vệ da", "kem-chong-nang"],
      ["Serum & Tinh chất phục hồi", "serum-tinh-chat"],
      ["Sữa rửa mặt & Nước tẩy trang", "sua-rua-mat"],
      ["Kem dưỡng ẩm sâu", "kem-duong-am"],
      ["Son môi cao cấp", "son-moi"]
    ]
  },
  {
    name: "Nhà cửa & Đời sống",
    slug: "nha-cua-doi-song",
    icon: "Home",
    subs: [
      ["Bộ Chăn Ga Gối Cao Cấp", "chan-ga-goi-dem"],
      ["Hộp đựng thực phẩm & Đồ bếp", "dung-cu-nha-bep"],
      ["Đèn bàn học chống cận & Trang trí", "den-trang-tri"],
      ["Kệ để đồ đa năng", "ke-tu-gia-do"],
      ["Thảm lau chân & Đồ nhà tắm", "tham-nha-tam"]
    ]
  }
];

// -------------------------------------------------------------
// 3. PRODUCT CATALOG DATA TEMPLATES FOR EACH CATEGORY
// -------------------------------------------------------------
const CATALOG_TEMPLATES = {
  // GIA DỤNG (dien-lanh-gia-dung)
  "noi-chien-khong-dau": [
    {
      brand: "philips",
      name: "Nồi Chiên Không Dầu Điện Tử Philips Airfryer XXL HD9650 (7.3L - 2225W)",
      price: 4890000,
      origPrice: 6590000,
      img: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800",
      specs: [
        ["Thông số kỹ thuật", "Dung tích", "7.3 Lít (chứa nguyên con gà 1.5kg)"],
        ["Thông số kỹ thuật", "Công suất", "2225W"],
        ["Công nghệ", "Công nghệ chiên", "Twin TurboStar giảm 90% lượng dầu mỡ"],
        ["Bảo hành", "Bảo hành", "24 tháng chính hãng"]
      ],
      variants: ["Đen Bóng Titan", "Trắng Tinh Tế"],
      desc: "Nồi chiên không dầu Philips XXL công nghệ Twin TurboStar loại bỏ đến 90% dầu mỡ thừa, dung tích siêu lớn chiên gà nguyên con giòn rụm bên ngoài mọng nước bên trong."
    },
    {
      brand: "tefal",
      name: "Nồi Chiên Không Dầu Nướng 2 trong 1 Tefal Easy Fry & Grill EY5058 (4.2L)",
      price: 2690000,
      origPrice: 3890000,
      img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800",
      specs: [
        ["Thông số kỹ thuật", "Dung tích", "4.2 Lít"],
        ["Thông số kỹ thuật", "Công suất", "1550W"],
        ["Chức năng", "Chức năng nướng", "Vỉ nướng gang đúc chống dính cao cấp"],
        ["Bảo hành", "Bảo hành", "24 tháng chính hãng"]
      ],
      variants: ["Đen Xám", "Thép Không Gỉ"],
      desc: "Tefal Easy Fry & Grill tích hợp 2 chức năng Chiên không dầu và Nướng than hoa với vỉ gang đúc dày dặn tạo vệt nướng đẹp mắt chuẩn nhà hàng."
    },
    {
      brand: "lock-lock",
      name: "Nồi Chiên Không Dầu Lock&Lock Điện Tử Eco Fryer EJF284 (5.5L)",
      price: 1990000,
      origPrice: 2890000,
      img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
      specs: [
        ["Thông số kỹ thuật", "Dung tích", "5.5 Lít"],
        ["Thông số kỹ thuật", "Công suất", "1800W"],
        ["Bảng điều khiển", "Màn hình", "Cảm ứng điện tử 8 chế độ tự động"],
        ["Bảo hành", "Bảo hành", "12 tháng chính hãng"]
      ],
      variants: ["Đen Ngọc", "Trắng Sữa"],
      desc: "Nồi chiên Lock&Lock 5.5L với 8 menu nấu tự động cài đặt sẵn, khay chiên tráng lớp chống dính Teflon an toàn cho sức khỏe."
    }
  ],

  "robot-hut-bui": [
    {
      brand: "xiaomi",
      name: "Robot Hút Bụi Lau Nhà Xiaomi Vacuum X20 Plus (Lực hút 6000Pa - Tự giặt sấy giẻ)",
      price: 8990000,
      origPrice: 11990000,
      img: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=800",
      specs: [
        ["Hiệu năng", "Lực hút", "6000 Pa siêu mạnh"],
        ["Công nghệ", "Điều hướng", "Laser LDS 360 độ + Cảm biến tránh vật cản"],
        ["Trạm sạc", "Dock sạc tự động", "Tự động giặt giẻ lau, sấy khô khí nóng, gom rác"],
        ["Bảo hành", "Bảo hành", "12 tháng chính hãng Xiaomi"]
      ],
      variants: ["Trắng Tinh Khôi"],
      desc: "Xiaomi X20+ là dòng robot hút bụi lau nhà toàn năng với dock sạc đa năng tự giặt giẻ và gom rác thông minh, điều khiển tiện lợi qua Mi Home app."
    },
    {
      brand: "panasonic",
      name: "Máy Lọc Không Khí Bù Ẩm Panasonic Nanoe-X F-PXM55A (Phòng 42m2)",
      price: 6490000,
      origPrice: 8200000,
      img: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800",
      specs: [
        ["Công nghệ", "Diệt khuẩn", "Nanoe-X thế hệ mới ức chế 99.9% virus, vi khuẩn"],
        ["Màng lọc", "Bộ lọc", "HEPA tổng hợp lọc bụi mịn PM2.5 + Than hoạt tính khử mùi"],
        ["Diện tích", "Phạm vi sử dụng", "Phù hợp phòng ngủ, phòng khách diện tích đến 42m2"],
        ["Bảo hành", "Bảo hành", "12 tháng Panasonic chính hãng"]
      ],
      variants: ["Trắng Ngọc Trai"],
      desc: "Máy lọc không khí Panasonic trang bị công nghệ Nanoe-X tiên tiến khử mùi hôi, lọc sạch 99.97% bụi mịn PM2.5 bảo vệ tối đa hệ hô hấp gia đình bạn."
    }
  ],

  "noi-com-dien": [
    {
      brand: "panasonic",
      name: "Nồi Cơm Điện Cao Tần Panasonic IH SR-HL151KRA (1.5L - Nấu cơm dẻo ngon)",
      price: 3490000,
      origPrice: 4500000,
      img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800",
      specs: [
        ["Công nghệ nấu", "Gia nhiệt", "Công nghệ điện từ IH 2 tầng đối lưu"],
        ["Lòng nồi", "Chất liệu", "Lòng nồi than Binchotan phủ lớp chống dính bền bỉ"],
        ["Dung tích", "Dung tích", "1.5 Lít (thích hợp gia đình 3-5 người)"],
        ["Bảo hành", "Bảo hành", "12 tháng chính hãng"]
      ],
      variants: ["Đen Kim Cương"],
      desc: "Nồi cơm điện cao tần Panasonic IH làm nóng hạt gạo từ sâu bên trong với lòng nồi phủ than Binchotan giúp cơm chín đều, dẻo thơm từng hạt."
    },
    {
      brand: "sunhouse",
      name: "Nồi Cơm Điện Tử Đa Năng Sunhouse Mama SHD8909 (1.8L - Lòng nồi gang đúc)",
      price: 1350000,
      origPrice: 1890000,
      img: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800",
      specs: [
        ["Dung tích", "Dung tích", "1.8 Lít (gia đình 4-6 người)"],
        ["Công suất", "Công suất", "860W"],
        ["Chức năng", "Chế độ nấu", "Nấu cơm, làm bánh, hầm cháo, giữ ấm 24h"],
        ["Bảo hành", "Bảo hành", "24 tháng Sunhouse chính hãng"]
      ],
      variants: ["Vàng Gold", "Bạc Silver"],
      desc: "Sunhouse Mama SHD8909 sở hữu lòng nồi gang dày 2.8mm tráng men chống dính Whitford từ Mỹ cùng hệ thống hẹn giờ nấu thông minh."
    }
  ],

  // THỜI TRANG NAM (thoi-trang-nam)
  "ao-thun-nam": [
    {
      brand: "coolmate",
      name: "Áo Thun Nam Cotton Compact Siêu Thoáng Mát Coolmate Cổ Tròn Form Regular",
      price: 189000,
      origPrice: 259000,
      img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
      specs: [
        ["Chất liệu", "Chất vải", "100% Cotton Compact 220gsm chống xù lông"],
        ["Form dáng", "Kiểu dáng", "Regular Fit tôn dáng, năng động"],
        ["Xuất xứ", "Sản xuất", "Việt Nam (Tự hào sản xuất tại xưởng may đạt chuẩn)"],
        ["Bảo hành", "Đổi trả", "60 ngày đổi trả miễn phí không cần lý do"]
      ],
      variants: ["Đen (Size M)", "Đen (Size L)", "Trắng (Size L)", "Xanh Navy (Size XL)"],
      desc: "Áo thun nam Coolmate may từ sợi Cotton Compact chải kỹ mềm mại, thấm hút mồ hôi tối ưu, không phai màu hay co rút sau nhiều lần giặt."
    },
    {
      brand: "coolmate",
      name: "Áo Polo Nam Pique Cotton Thoáng Khí Chống Nhăn Coolmate Cafe Dệt Tổ Ong",
      price: 299000,
      origPrice: 399000,
      img: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800",
      specs: [
        ["Chất liệu", "Sợi vải", "50% Sợi bã cà phê S.Café + 50% Recycled Poly khử mùi"],
        ["Cổ áo", "Kiểu cổ", "Cổ bẻ dệt bo định hình không bị quăn mép"],
        ["Tính năng", "Tính năng", "Kháng khuẩn tự nhiên, chống tia UV UPF 50+"],
        ["Bảo hành", "Đổi trả", "60 ngày đổi trả 100%"]
      ],
      variants: ["Xanh Rêu (Size L)", "Đen Tuyền (Size XL)", "Xám Tiêu (Size M)"],
      desc: "Áo Polo Cafe Coolmate dệt từ sợi bã cà phê kiểm soát mùi vượt trội, giữ phom đứng dáng thanh lịch khi đi làm hay dạo phố."
    },
    {
      brand: "uniqlo",
      name: "Áo Thun Nam Cổ Tròn Không Đường May Uniqlo AIRism Cotton Siêu Nhẹ",
      price: 349000,
      origPrice: 420000,
      img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800",
      specs: [
        ["Công nghệ", "Vải AIRism", "Mặt trong sợi AIRism mát lạnh, mặt ngoài Cotton tự nhiên"],
        ["Thiết kế", "Kiểu dáng", "Oversized hiện đại, tay lỡ trẻ trung"],
        ["Xuất xứ", "Thương hiệu", "Uniqlo Nhật Bản"],
        ["Bảo quản", "Giặt ủi", "Giặt máy giặt chế độ nhẹ"]
      ],
      variants: ["Trắng Sữa (Size L)", "Xanh Olive (Size M)", "Hồng Đất (Size L)"],
      desc: "Áo thun Uniqlo AIRism Cotton kết hợp hoàn hảo giữa độ mát mịn của sợi AIRism và vẻ đẹp đứng phom của vải cotton tự nhiên."
    }
  ],

  "ao-so-mi-nam": [
    {
      brand: "an-phuoc",
      name: "Áo Sơ Mi Nam Tay Dài Cao Cấp An Phước Pierre Cardin Chống Nhăn Form Classic",
      price: 990000,
      origPrice: 1350000,
      img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
      specs: [
        ["Chất liệu", "Vải chính", "100% Cotton chải kỹ xử lý công nghệ Non-Iron chống nhăn"],
        ["Đường may", "Chi tiết", "Cúc áo khắc laser xà cừ, đường may 20 mũi/inch"],
        ["Kiểu dáng", "Form áo", "Regular Fit công sở sang trọng"],
        ["Bảo hành", "Chính hãng", "Cam kết chính hãng An Phước Pierre Cardin"]
      ],
      variants: ["Xanh Nhạt Kẻ Sọc (Size 39)", "Trắng Trơn (Size 40)", "Xanh Biển (Size 41)"],
      desc: "Áo sơ mi nam An Phước Pierre Cardin thể hiện đẳng cấp quý ông công sở, chất vải 100% cotton chống nhăn cao cấp giữ phom phẳng phiu suốt ngày dài."
    },
    {
      brand: "routine",
      name: "Áo Sơ Mi Nam Vải Modal Lụa Mềm Mát Routine Cổ Cuba Tay Ngắn Form Rộng",
      price: 450000,
      origPrice: 590000,
      img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
      specs: [
        ["Chất liệu", "Sợi dệt", "80% Modal chiết xuất gỗ sồi + 20% Polyester"],
        ["Kiểu cổ", "Thiết kế", "Cổ Cuba phong cách Vintage lãng tử"],
        ["Mùa thích hợp", "Thời tiết", "Thích hợp mùa hè, du lịch, dạo phố"],
        ["Xuất xứ", "Thương hiệu", "Routine Vietnam"]
      ],
      variants: ["Họa tiết Bohemian (Size M)", "Họa tiết Biển Nhiệt Đới (Size L)"],
      desc: "Áo sơ mi cổ Cuba Routine mang đến diện mạo phóng khoáng, chất liệu sợi Modal mịn màng tạo cảm giác mát lạnh tức thì khi mặc."
    }
  ],

  "quan-jeans-nam": [
    {
      brand: "routine",
      name: "Quần Jeans Nam Xanh Indigo Routine Dáng Slim Fit Co Giãn 4 Chiều",
      price: 590000,
      origPrice: 790000,
      img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
      specs: [
        ["Chất liệu", "Vải Denim", "98% Cotton Denim + 2% Spandex co giãn đàn hồi"],
        ["Xử lý màu", "Wash màu", "Kỹ thuật Enzyme Wash bền màu, giữ độ sờn tự nhiên"],
        ["Phụ kiện", "Khóa kéo", "Khóa đồng YKK chính hãng siêu bền"],
        ["Bảo hành", "Đổi trả", "Hỗ trợ đổi size trong 30 ngày"]
      ],
      variants: ["Xanh Đậm (Size 30)", "Xanh Đậm (Size 31)", "Xanh Sáng Wash (Size 32)"],
      desc: "Quần Jeans nam Routine với form Slim Fit tôn dáng đôi chân, chất vải co giãn nhẹ đem lại sự thoải mái khi di chuyển cả ngày."
    }
  ],

  // THỜI TRANG NỮ (thoi-trang-nu)
  "vay-dam-nu": [
    {
      brand: "elise",
      name: "Đầm Xòe Công Sở Nữ Elise Cổ Chữ V Thắt Đai Eo Tôn Dáng Cao Cấp",
      price: 1498000,
      origPrice: 1998000,
      img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
      specs: [
        ["Chất liệu", "Chất vải", "Tuyết Mưa Hàn Quốc cao cấp co giãn nhẹ"],
        ["Thiết kế", "Kiểu dáng", "Đầm chữ A xòe nhẹ, đai eo phối khóa kim loại sang trọng"],
        ["Lót trong", "Lớp lót", "Lót lụa Habutai mềm mịn thấm hút"],
        ["Bảo hành", "Chính hãng", "100% Elise Fashion chính hãng"]
      ],
      variants: ["Đỏ Rượu Vang (Size S)", "Xanh Navy (Size M)", "Be Pastel (Size L)"],
      desc: "Thiết kế đầm xòe Elise nổi bật với đường cắt may chuẩn xác, ôm nhẹ vòng eo và xòe nhẹ che khuyết điểm, toát lên nét đẹp thanh lịch quý phái."
    },
    {
      brand: "ivy-moda",
      name: "Đầm Suông Nữ Lụa Satin In Họa Tiết Hoa IVY moda Cổ Yếm Dạo Phố",
      price: 1190000,
      origPrice: 1590000,
      img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
      specs: [
        ["Chất liệu", "Vải chính", "Lụa Satin dệt mềm bóng nhẹ, thướt tha"],
        ["Họa tiết", "In chuyển nhiệt", "Họa tiết hoa Flora vẽ tay độc quyền"],
        ["Phong cách", "Ứng dụng", "Thích hợp dự tiệc nhẹ, dạo phố, chụp ảnh du lịch"],
        ["Xuất xứ", "Thương hiệu", "IVY moda Việt Nam"]
      ],
      variants: ["Họa Tiết Hoa Xanh (Size S)", "Họa Tiết Hoa Cam (Size M)"],
      desc: "Đầm lụa Satin IVY moda sở hữu độ rủ mềm mại tự nhiên, thiết kế dáng suông thoải mái mang lại vẻ đẹp bay bổng cuốn hút cho phái đẹp."
    },
    {
      brand: "gumac",
      name: "Đầm Chữ A Nữ Gumac Phối Cổ Phối Tay Phồng Phong Cách Tiểu Thư",
      price: 499000,
      origPrice: 750000,
      img: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800",
      specs: [
        ["Chất liệu", "Vải", "Chiffon Hàn Quốc phối ren cao cấp"],
        ["Kiểu dáng", "Form đầm", "Dáng ngắn trẻ trung tôn chân dài"],
        ["Độ tuổi", "Phong cách", "Tiểu thư thanh lịch, trẻ trung năng động"],
        ["Đổi trả", "Chính sách", "Đổi hàng trong 15 ngày tại showroom Gumac"]
      ],
      variants: ["Trắng Kem (Size S)", "Hồng Phấn (Size M)", "Đen (Size L)"],
      desc: "Đầm chữ A Gumac tay phồng tạo điểm nhấn dễ thương, chất liệu chiffon nhẹ tênh giúp các nàng tự tin tỏa sáng mọi khoảnh khắc."
    }
  ],

  "ao-blazer-nu": [
    {
      brand: "zara",
      name: "Áo Khoác Blazer Nữ 2 Hàng Khuy Zara Oversized Phong Cách Hàn Quốc",
      price: 1299000,
      origPrice: 1799000,
      img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
      specs: [
        ["Chất liệu", "Vải chính", "Vải Dạ dệt chéo đứng phom, giữ ấm nhẹ"],
        ["Chi tiết", "Cúc áo", "Khuy kim loại mạ đồng vintage, độn vai tinh tế"],
        ["Form dáng", "Form áo", "Oversized chuẩn xu hướng street style"],
        ["Xuất xứ", "Thương hiệu", "Zara Tây Ban Nha"]
      ],
      variants: ["Kẻ Caro Nâu (Size XS)", "Đen Classic (Size S)", "Xám Khói (Size M)"],
      desc: "Áo Blazer Zara 2 hàng khuy là item không thể thiếu trong tủ đồ của các cô gái hiện đại, dễ dàng phối cùng áo phông, croptop hoặc đầm liền."
    }
  ],

  // MỸ PHẨM (my-pham-cham-soc-ca-nhan)
  "kem-chong-nang": [
    {
      brand: "la-roche-posay",
      name: "Kem Chống Nắng La Roche-Posay Anthelios UVMune 400 Oil Control Gel-Cream SPF50+ (50ml)",
      price: 435000,
      origPrice: 535000,
      img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
      specs: [
        ["Chỉ số chống nắng", "SPF/PA", "SPF50+ / PA++++ với màng lọc Mexoryl 400 độc quyền"],
        ["Loại da", "Phù hợp da", "Da dầu, hỗn hợp thiên dầu, da mụn nhạy cảm"],
        ["Công nghệ", "Kiểm soát dầu", "Airlicium hấp thụ bã nhờn, kiềm dầu đến 12h"],
        ["Bảo hành", "Cam kết", "Chính hãng 100% tem phụ nhập khẩu chính ngạch"]
      ],
      variants: ["Bản Có Màu (50ml)", "Bản Không Màu Kiềm Dầu (50ml)"],
      desc: "Kem chống nắng kiểm soát dầu số 1 từ Pháp với màng lọc Mexoryl 400 ngăn chặn cả tia UVA siêu dài, kết cấu mỏng nhẹ thẩm thấu nhanh không gây bết dính."
    }
  ],

  "serum-tinh-chat": [
    {
      brand: "la-roche-posay",
      name: "Serum Phục Hồi & Tái Tạo Da La Roche-Posay Hyalu B5 Pure Hyaluronic Acid (30ml)",
      price: 990000,
      origPrice: 1250000,
      img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
      specs: [
        ["Thành phần chính", "Hoạt chất", "Hyaluronic Acid đa phân tử + Vitamin B5 + Rau má Madecassoside"],
        ["Công dụng", "Tác dụng", "Cấp ẩm căng mọng, làm dịu da kích ứng, mờ nếp nhăn"],
        ["Dung tích", "Dung tích", "30ml"],
        ["Xuất xứ", "Thương hiệu", "La Roche-Posay Pháp"]
      ],
      variants: ["Chai 30ml", "Chai 50ml Tiết Kiệm"],
      desc: "Tinh chất phục hồi Hyalu B5 của La Roche-Posay chứa phức hợp HA tinh khiết và Vitamin B5 giúp phục hồi hàng rào bảo vệ da sau 1 giờ."
    },
    {
      brand: "paulas-choice",
      name: "Dung Dịch Tẩy Tế Bào Chết Hóa Học Paula's Choice Skin Perfecting 2% BHA Liquid Exfoliant (118ml)",
      price: 899000,
      origPrice: 1100000,
      img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
      specs: [
        ["Nồng độ BHA", "Salicylic Acid", "2% BHA làm sạch sâu lỗ chân lông, giảm mụn ẩn"],
        ["Độ pH", "Chỉ số pH", "3.2 - 3.8 tối ưu hiệu quả tẩy da chết dịu nhẹ"],
        ["Dung tích", "Dung tích", "118ml"],
        ["Xuất xứ", "Nguồn gốc", "Paula's Choice USA chính hãng"]
      ],
      variants: ["Chai Fullsize 118ml", "Bản Minisize 30ml"],
      desc: "Sản phẩm tẩy tế bào chết hóa học huyền thoại chứa 2% BHA hòa tan dầu thừa sâu trong lỗ chân lông, giải quyết dứt điểm mụn đầu đen và mụn ẩn."
    },
    {
      brand: "cocoon",
      name: "Nước Dưỡng Tóc Tinh Dầu Bưởi Thuần Chay Cocoon Pomelo Hair Tonic Giảm Rụng Tóc (140ml)",
      price: 145000,
      origPrice: 185000,
      img: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800",
      specs: [
        ["Thành phần", "Nguyên liệu", "Tinh dầu vỏ bưởi nguyên chất + Vitamin B5 + Xylishine"],
        ["Chứng nhận", "Tiêu chuẩn", "100% Thuần chay (Vegan) chứng nhận bởi The Vegan Society"],
        ["Công dụng", "Hiệu quả", "Kích thích mọc tóc nhanh, nuôi dưỡng nang tóc chắc khỏe"],
        ["Xuất xứ", "Thương hiệu", "Cocoon Vietnam"]
      ],
      variants: ["Chai 140ml", "Combo 2 Chai 140ml"],
      desc: "Nước dưỡng tóc Cocoon từ tinh dầu vỏ bưởi Việt Nam cung cấp dưỡng chất thiết yếu cho da đầu, giảm gãy rụng và nuôi tóc con mọc dày bồng bềnh."
    }
  ],

  "sua-rua-mat": [
    {
      brand: "innisfree",
      name: "Sữa Rửa Mặt Trà Xanh Dưỡng Ẩm Innisfree Green Tea Amino Cleansing Foam (150g)",
      price: 210000,
      origPrice: 280000,
      img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800",
      specs: [
        ["Chiết xuất", "Thành phần", "Beauty Green Tea từ đảo Jeju chứa 16 loại amino acid"],
        ["Kết cấu", "Dạng bọt", "Bọt xốp mịn làm sạch bụi mịn không gây khô căng"],
        ["Trọng lượng", "Khối lượng", "150g"],
        ["Thương hiệu", "Xuất xứ", "Innisfree Hàn Quốc"]
      ],
      variants: ["Tuýp 150g"],
      desc: "Sữa rửa mặt trà xanh Innisfree giàu amino acid giúp làm sạch sâu bã nhờn đồng thời cấp ẩm nhẹ nhàng, mang lại cảm giác sảng khoái và tươi mát cho làn da."
    }
  ],

  // NHÀ CỬA & ĐỜI SỐNG (nha-cua-doi-song)
  "chan-ga-goi-dem": [
    {
      brand: "ikea",
      name: "Bộ Drap Chăn Ga Gối Cotton Lụa Cao Cấp IKEA ÄNGSLILJA (1m8 x 2m)",
      price: 1250000,
      origPrice: 1650000,
      img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
      specs: [
        ["Chất liệu", "Sợi dệt", "100% Sợi bông Cotton hữu cơ mật độ 300 sợi/inch"],
        ["Kích thước", "Quy cách", "1 Ga bọc chun (180x200cm) + 1 Vỏ chăn (200x220cm) + 2 Vỏ gối"],
        ["Đặc tính", "Đặc điểm", "Mát mẻ mùa hè, giữ nhiệt ấm êm mùa đông, không xù lông"],
        ["Thương hiệu", "Xuất xứ", "IKEA Thụy Điển"]
      ],
      variants: ["Xám Khói (1m8x2m)", "Xanh Sage (1m8x2m)", "Trắng Tinh Khôi (1m8x2m)"],
      desc: "Bộ chăn ga IKEA chất liệu cotton lụa thoáng khí cao cấp mang lại giấc ngủ êm ái, nâng niu làn da sau những giờ làm việc mệt mỏi."
    }
  ],

  "dung-cu-nha-bep": [
    {
      brand: "lock-lock",
      name: "Bộ 3 Hộp Thủy Tinh Chịu Nhiệt Lock&Lock Borosilicate Glass Kèm Túi Giữ Nhiệt",
      price: 380000,
      origPrice: 520000,
      img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
      specs: [
        ["Chất liệu", "Thủy tinh", "Thủy tinh Borosilicate chịu nhiệt đến 400°C"],
        ["Sử dụng", "Tiện ích", "An toàn với lò vi sóng, lò nướng, máy rửa chén"],
        ["Nắp khóa", "Gioăng cao su", "Nắp khóa 4 khớp kín khí tuyệt đối chống tràn nước"],
        ["Bảo hành", "Thương hiệu", "Lock&Lock chính hãng"]
      ],
      variants: ["Set 3 Hộp Chữ Nhật (730ml) + Túi Giữ Nhiệt"],
      desc: "Bộ hộp thủy tinh Lock&Lock chịu nhiệt cao cấp thích hợp đựng cơm mang đi làm, giữ nhiệt tốt và không bám mùi màu thực phẩm."
    },
    {
      brand: "inochi",
      name: "Bộ Thau Rổ Xoay Đa Năng Cao Cấp Inochi Yoko Kháng Khuẩn Ag+",
      price: 185000,
      origPrice: 245000,
      img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
      specs: [
        ["Chất liệu", "Nhựa nguyên sinh", "Nhựa PP nguyên sinh cao cấp tích hợp ion Bạc Ag+ kháng khuẩn"],
        ["Thiết kế", "Trục xoay", "Trục xoay 360 độ tự cân bằng, thoát nước siêu nhanh"],
        ["Kích thước", "Đường kính", "26cm"],
        ["Thương hiệu", "Xuất xứ", "Inochi Việt Nam"]
      ],
      variants: ["Màu Xanh Bạc Hà", "Màu Be Sữa"],
      desc: "Bộ rổ xoay Inochi Yoko tiện lợi với thiết kế thông minh tự cân bằng giúp rửa rau củ, trái cây ráo nước nhanh chóng và vệ sinh."
    }
  ],

  "den-trang-tri": [
    {
      brand: "rang-dong",
      name: "Đèn Bàn Học LED Chống Cận Thị Rạng Đông Cảm Ứng Đổi 3 Màu Ánh Sáng RL-36 (9W)",
      price: 320000,
      origPrice: 450000,
      img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
      specs: [
        ["Chỉ số hoàn màu", "CRI", "CRI > 90 phản ánh trung thực màu sắc, không gây mỏi mắt"],
        ["Chế độ sáng", "Nhiệt độ màu", "3 màu (Trắng 6500K, Trung tính 4000K, Vàng ấm 3000K)"],
        ["Công suất", "Điện năng", "9W tiết kiệm điện"],
        ["Bảo hành", "Chính hãng", "Bảo hành 24 tháng Rạng Đông"]
      ],
      variants: ["Trắng Sứ Cảm Ứng", "Hồng Pastel Cảm Ứng"],
      desc: "Đèn LED để bàn Rạng Đông trang bị chip LED chất lượng cao không phát ra tia tử ngoại, bảo vệ tối đa thị lực học sinh và dân văn phòng."
    }
  ],

  "ke-tu-gia-do": [
    {
      brand: "ikea",
      name: "Xe Đẩy Kệ Để Đồ Đa Năng 3 Tầng IKEA RÅSKOG Bằng Thép Sơn Tĩnh Điện (Có Bánh Xe)",
      price: 850000,
      origPrice: 1150000,
      img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
      specs: [
        ["Chất liệu", "Khung xe", "Thép phủ sơn tĩnh điện chống gỉ sét, chịu tải 30kg"],
        ["Bánh xe", "Di chuyển", "4 bánh xe xoay 360 độ êm ái có khóa bánh chống trượt"],
        ["Kích thước", "Thông số", "35 x 45 x 77 cm"],
        ["Thương hiệu", "Xuất xứ", "IKEA Thụy Điển"]
      ],
      variants: ["Màu Đen Mờ", "Màu Trắng Sữa", "Màu Xanh Ngọc"],
      desc: "Kệ xe đẩy 3 tầng IKEA RÅSKOG tiện dụng trong mọi không gian bếp, phòng tắm hoặc bàn làm việc, dễ dàng di chuyển và vệ sinh."
    }
  ]
};

// -------------------------------------------------------------
// 4. GENERATE CATALOG MIGRATION (V4) & INVENTORY MIGRATION (V3)
// -------------------------------------------------------------
console.log("Generating full catalog & inventory seeds...");

const catalogSql = [];
const inventorySql = [];
const nowStr = new Date().toISOString();

catalogSql.push("-- Seed SQL Generated for Complete E-Commerce Platform (Tech, Home, Fashion, Beauty, Living)\n");
catalogSql.push("DELETE FROM product_comments;");
catalogSql.push("DELETE FROM product_reviews;");
catalogSql.push("DELETE FROM product_media;");
catalogSql.push("DELETE FROM product_specifications;");
catalogSql.push("DELETE FROM product_variants;");
catalogSql.push("DELETE FROM products;");
catalogSql.push("DELETE FROM categories;");
catalogSql.push("DELETE FROM brands;\n");

inventorySql.push("-- Seed SQL Generated for Inventory Items\n");
inventorySql.push("DELETE FROM inventory_items;\n");

// 1. Insert Brands
const brandMap = {};
for (const [bName, bSlug, bLogo, bDesc, bCountry] of BRANDS_DATA) {
  const bId = uuidv4();
  brandMap[bSlug] = { id: bId, name: bName, desc: bDesc, country: bCountry };
  catalogSql.push(
    `INSERT INTO brands (id, name, slug, logo_url, description, country, created_at, updated_at) ` +
    `VALUES ('${bId}', '${bName.replace(/'/g, "''")}', '${bSlug}', '${bLogo}', '${bDesc.replace(/'/g, "''")}', '${bCountry.replace(/'/g, "''")}', '${nowStr}', '${nowStr}') ` +
    `ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url;`
  );
}

// 2. Insert Categories
for (const cat of CATEGORIES_TREE) {
  const pId = uuidv4();
  catalogSql.push(
    `INSERT INTO categories (id, name, slug, icon, created_at, updated_at) ` +
    `VALUES ('${pId}', '${cat.name}', '${cat.slug}', '${cat.icon}', '${nowStr}', '${nowStr}') ` +
    `ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;`
  );
  for (const [sName, sSlug] of cat.subs) {
    const cId = uuidv4();
    catalogSql.push(
      `INSERT INTO categories (id, parent_id, name, slug, icon, created_at, updated_at) ` +
      `VALUES ('${cId}', (SELECT id FROM categories WHERE slug = '${cat.slug}' LIMIT 1), '${sName}', '${sSlug}', '${cat.icon}', '${nowStr}', '${nowStr}') ` +
      `ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = (SELECT id FROM categories WHERE slug = '${cat.slug}' LIMIT 1);`
    );
  }
}

// 3. Helper to insert a product + specs + media + variants + reviews + inventory item
let globalProductIdx = 1000;

function insertProductItem(item, subCatSlug, idx) {
  const pId = uuidv4();
  const brand = brandMap[item.brand] || brandMap["xiaomi"];
  const sku = `SKU-${item.brand.toUpperCase().slice(0, 4)}-${globalProductIdx++}`;
  const barcode = `893${1000000000 + globalProductIdx}`;
  const slug = `${item.brand}-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}-${globalProductIdx}`;
  
  const pNameEsc = item.name.replace(/'/g, "''");
  const brandNameEsc = brand.name.replace(/'/g, "''");
  const discountPct = Math.round(((item.origPrice - item.price) / item.origPrice) * 100);
  const shortDescEsc = `${item.name} chính hãng ${brand.name} (${brand.country}). Chất lượng vượt trội, thiết kế tinh tế.`.replace(/'/g, "''");
  
  const specsList = item.specs.map(([g, k, v]) => `<li><strong>${k.replace(/'/g, "''")}:</strong> ${v.replace(/'/g, "''")}</li>`).join("");
  const fullDesc = `<p><strong>${pNameEsc}</strong> là sản phẩm cao cấp chính hãng từ thương hiệu <strong>${brandNameEsc}</strong> (${brand.country}).</p><p>${item.desc.replace(/'/g, "''")}</p><ul>${specsList}</ul>`;
  
  const ratingAvg = (4.6 + Math.random() * 0.4).toFixed(1);
  const ratingCount = randInt(45, 320);
  const soldCount = randInt(120, 1850);

  // Insert into products using subquery for category_id and brand_id
  catalogSql.push(
    `INSERT INTO products (` +
    `id, category_id, brand_id, sku, barcode, name, slug, short_description, description, ` +
    `price, original_price, discount_percent, image_url, origin_country, warranty_policy, ` +
    `rating_avg, rating_count, sold_count, status, version, created_at, updated_at` +
    `) VALUES (` +
    `'${pId}', ` +
    `(SELECT id FROM categories WHERE slug = '${subCatSlug}' LIMIT 1), ` +
    `(SELECT id FROM brands WHERE slug = '${item.brand}' LIMIT 1), ` +
    `'${sku}', '${barcode}', '${pNameEsc}', '${slug}', '${shortDescEsc}', '${fullDesc}', ` +
    `${item.price}, ${item.origPrice}, ${discountPct}, '${item.img}', '${brand.country}', 'Bảo hành chính hãng 12-24 tháng', ` +
    `${ratingAvg}, ${ratingCount}, ${soldCount}, 'ACTIVE', 0, '${nowStr}', '${nowStr}'` +
    `) ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, status = 'ACTIVE';`
  );

  // Insert Specifications
  item.specs.forEach(([gName, sKey, sVal], sIdx) => {
    const specId = uuidv4();
    catalogSql.push(
      `INSERT INTO product_specifications (id, product_id, group_name, spec_key, spec_value, sort_order) ` +
      `VALUES ('${specId}', '${pId}', '${gName.replace(/'/g, "''")}', '${sKey.replace(/'/g, "''")}', '${sVal.replace(/'/g, "''")}', ${sIdx + 1});`
    );
  });

  // Insert Media
  const mediaId = uuidv4();
  catalogSql.push(
    `INSERT INTO product_media (id, product_id, media_type, media_url, sort_order, created_at) ` +
    `VALUES ('${mediaId}', '${pId}', 'IMAGE', '${item.img}', 1, '${nowStr}');`
  );

  // Insert Variants
  (item.variants || ["Tiêu Chuẩn"]).forEach((vName, vIdx) => {
    const varId = uuidv4();
    const varSku = `${sku}-V${vIdx + 1}`;
    const attrJson = JSON.stringify({ version: vName }).replace(/'/g, "''");
    catalogSql.push(
      `INSERT INTO product_variants (id, product_id, sku, name, price, original_price, image_url, stock_quantity, attributes_json, created_at, updated_at) ` +
      `VALUES ('${varId}', '${pId}', '${varSku}', '${pNameEsc} - ${vName.replace(/'/g, "''")}', ${item.price}, ${item.origPrice}, '${item.img}', 50, '${attrJson}', '${nowStr}', '${nowStr}') ` +
      `ON CONFLICT (sku) DO NOTHING;`
    );
  });

  // Insert Sample Reviews using customer user id
  [
    [5, "Sản phẩm xài cực kỳ ưng ý, chất lượng hoàn thiện tuyệt vời, đóng gói cẩn thận!"],
    [5, "Giao hàng siêu nhanh, hàng chính hãng nguyên seal, ủng hộ shop dài lâu!"],
    [4, "Chất lượng đúng mô tả, giá cả phải chăng, rất đáng mua."]
  ].forEach(([revScore, revContent]) => {
    const revId = uuidv4();
    const uId = 'b0000000-0000-0000-0000-000000000002';
    catalogSql.push(
      `INSERT INTO product_reviews (id, product_id, user_id, user_name, rating, content, is_verified_purchase, likes_count, created_at) ` +
      `VALUES ('${revId}', (SELECT id FROM products WHERE sku = '${sku}' LIMIT 1), '${uId}', 'Khách hàng thân thiết', ${revScore}, '${revContent.replace(/'/g, "''")}', true, 18, '${nowStr}');`
    );
  });

  // Insert Inventory Item (Stock available for order-service checkout)
  const invId = uuidv4();
  const stockQty = randInt(50, 300);
  inventorySql.push(
    `INSERT INTO inventory_items (id, product_id, sku, name, quantity_on_hand, quantity_reserved, low_stock_threshold, sold_quantity, created_at, updated_at) ` +
    `VALUES ('${invId}', '${pId}', '${sku}', '${pNameEsc}', ${stockQty}, 0, 5, ${soldCount}, '${nowStr}', '${nowStr}') ` +
    `ON CONFLICT (sku) DO UPDATE SET quantity_on_hand = EXCLUDED.quantity_on_hand, product_id = EXCLUDED.product_id;`
  );
}

// 4. Insert all items from template categories
for (const [subCatSlug, items] of Object.entries(CATALOG_TEMPLATES)) {
  items.forEach((item, idx) => {
    insertProductItem(item, subCatSlug, idx);
    // Multiply items slightly so each category has multiple products
    for (let m = 1; m <= 2; m++) {
      const clone = {
        ...item,
        name: `${item.name} (Bản Nâng Cấp Plus #${m})`,
        price: Math.floor(item.price * (1 + m * 0.08)),
        origPrice: Math.floor(item.origPrice * (1 + m * 0.08))
      };
      insertProductItem(clone, subCatSlug, idx * 10 + m);
    }
  });
}

// 5. Also retain top tech products for Phones & Laptops
const TECH_BRANDS = ["apple", "samsung", "xiaomi", "asus", "dell", "sony", "lg"];
const TECH_PROFILES = [
  { sub: "dien-thoai-smartphone", name: "Flagship 5G Ultra Smartphone", price: 21990000, origPrice: 26990000, img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800" },
  { sub: "laptop-van-phong", name: "Laptop Mỏng Nhẹ Doanh Nhân Cao Cấp", price: 24500000, origPrice: 29900000, img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800" },
  { sub: "laptop-gaming", name: "Laptop Gaming RTX 4070 Hiệu Năng Khủng", price: 35900000, origPrice: 42900000, img: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800" },
  { sub: "tai-nghe-bluetooth", name: "Tai Nghe Chống Ồn Chủ Động Không Dây Hi-Res", price: 4990000, origPrice: 6500000, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800" }
];

TECH_BRANDS.forEach((bSlug) => {
  TECH_PROFILES.forEach((p, pIdx) => {
    const brand = brandMap[bSlug];
    const techItem = {
      brand: bSlug,
      name: `${brand.name} ${p.name} Pro Edition`,
      price: p.price,
      origPrice: p.origPrice,
      img: p.img,
      specs: [
        ["Cấu hình", "Chipset", "Snapdragon 8 Gen 3 / Intel Core Ultra"],
        ["Bộ nhớ", "RAM / ROM", "16GB RAM + 512GB SSD NVMe"],
        ["Bảo hành", "Bảo hành", "24 tháng chính hãng"]
      ],
      variants: ["Đen Không Gian", "Bạc Ánh Kim"],
      desc: `Sản phẩm ${brand.name} đỉnh cao với hiệu năng mạnh mẽ, màn hình sắc nét và độ hoàn thiện tinh xảo.`
    };
    insertProductItem(techItem, p.sub, pIdx);
  });
});

// Write to centralized database directory
const rootDir = path.join(__dirname, "..");
const catalogSeedPath = path.join(rootDir, "database/seed/02_catalog_inventory_seed.sql");
const identitySeedPath = path.join(rootDir, "database/seed/01_identity_seed.sql");
const couponsSeedPath = path.join(rootDir, "database/seed/03_order_coupons_seed.sql");
const unifiedMigrationV2Path = path.join(rootDir, "database/migrations/V2__seed_data.sql");

const combinedCatalogInventory = [
  "-- =============================================================================",
  "-- 02_catalog_inventory_seed.sql",
  "-- Seed Brands, Categories, Products, Media, Variants, Specs, Reviews, and Inventory",
  "-- =============================================================================\n",
  ...catalogSql,
  "\n",
  ...inventorySql
].join("\n");

fs.writeFileSync(catalogSeedPath, combinedCatalogInventory, "utf8");
console.log(`Generated ${catalogSql.length + inventorySql.length} SQL statements into ${catalogSeedPath}`);

const identitySeed = fs.existsSync(identitySeedPath) ? fs.readFileSync(identitySeedPath, "utf8") : "";
const couponsSeed = fs.existsSync(couponsSeedPath) ? fs.readFileSync(couponsSeedPath, "utf8") : "";

const unifiedMigrationV2 = [
  "-- =============================================================================",
  "-- V2__seed_data.sql",
  "-- Unified Initial Seed Data for Mini E-Commerce Platform",
  "-- =============================================================================\n",
  identitySeed,
  "\n",
  combinedCatalogInventory,
  "\n",
  couponsSeed
].join("\n");

fs.writeFileSync(unifiedMigrationV2Path, unifiedMigrationV2, "utf8");
console.log(`Generated unified seed migration into ${unifiedMigrationV2Path}`);

