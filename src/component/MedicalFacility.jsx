import React, { useState, useEffect } from "react";

const API_BASE = "https://api.kidvik.com";

const MedicalFacilityListingBootstrap = () => {
  
  useEffect(() => {
    // CSS
    if (!document.getElementById("bootstrap-css")) {
      const link = document.createElement("link");
      link.id = "bootstrap-css";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    // JS (bootstrap bundle for offcanvas)
    if (!document.getElementById("bootstrap-js")) {
      const script = document.createElement("script");
      script.id = "bootstrap-js";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const [subCategories, setSubCategories] = useState([]);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState(null);

  const [partners, setPartners] = useState([]);

  // extra state to fetch all partners for counts (no subcategory filter)
  const [allPartnersForCounts, setAllPartnersForCounts] = useState([]);

  const safeArrayFromResponse = (data) =>
    data?.data || data?.results || (Array.isArray(data) ? data : data || []);

  const makeFullUrl = (path) => {
    if (!path) return null;
    const p = String(path).trim();
    if (!p) return null;
    if (p.startsWith("http")) return p;
    if (p.startsWith("/")) return `${API_BASE}${p}`;
    return `${API_BASE}/${p}`;
  };

  // FETCH categories
  useEffect(() => {
    fetch(`${API_BASE}/category_master/`)
      .then((res) => res.json())
      .then((data) => {
        const cats = safeArrayFromResponse(data);
        setCategories(cats);
        if (cats.length > 0) setActiveCategoryId(cats[0].id);
      })
      .catch((err) => console.error("Category fetch error", err));
  }, []);

  // FETCH subcategories
  useEffect(() => {
    if (!activeCategoryId) return;
    fetch(`${API_BASE}/sub_category/?category_id=${activeCategoryId}`)
      .then((res) => res.json())
      .then((data) => {
        const subs = safeArrayFromResponse(data);
        setSubCategories(subs);
        if (subs.length > 0) setActiveSubCategoryId(subs[0].id);
        else setActiveSubCategoryId(null);
      })
      .catch((err) => console.error("Subcategory fetch error", err));
  }, [activeCategoryId]);

  // FETCH partners (filtered)
  useEffect(() => {
    if (!activeCategoryId) return;
    let url = `${API_BASE}/partner_master/?category_id=${activeCategoryId}`;
    if (activeSubCategoryId !== null) url += `&sub_category_id=${activeSubCategoryId}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const ps = safeArrayFromResponse(data);
        setPartners(ps);
      })
      .catch((err) => {
        console.error("Partners fetch error", err);
        setPartners([]);
      });
  }, [activeCategoryId, activeSubCategoryId]);

  // FETCH all partners for counts (no subcategory filter)
  useEffect(() => {
    if (!activeCategoryId) return;
    const url = `${API_BASE}/partner_master/?category_id=${activeCategoryId}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const arr = safeArrayFromResponse(data);
        setAllPartnersForCounts(arr);
      })
      .catch((err) => {
        console.error("Counts partners fetch error", err);
        setAllPartnersForCounts([]);
      });
  }, [activeCategoryId]);

  // Helpers for UI
  const getPartnerName = (p) =>
    p?.name || p?.business_name || p?.title || p?.partner_name || p?.PartnerMaster_name || "Unnamed";

  const getPartnerAddress = (p) =>
    p?.address || p?.location || p?.full_address || (p?.city && p?.area ? `${p.area}, ${p.city}` : p?.city) || "Address not available";

  const getPartnerType = (p) =>
    p?.type ||
    (p?.sub_category && (p.sub_category.name || p.sub_category)) ||
    (p?.category && (p.category.name || p.category)) ||
    (activeSubCategoryId ? (subCategories.find((s) => String(s.id) === String(activeSubCategoryId))?.name || null) : null) ||
    "Type not available";

  const getPartnerImage = (p) => {
    const maybe =
      p?.image ||
      p?.logo ||
      p?.photo ||
      p?.partner_image ||
      (p?.images && p.images[0] && (p.images[0].url || p.images[0])) ||
      p?.thumbnail ||
      p?.banner ||
      p?.profile ||
      p?.file ||
      p?.icon_img ||
      null;

    if (maybe) return makeFullUrl(maybe);

    const partnerSubCatId = p?.sub_category?.id || p?.sub_category || activeSubCategoryId;
    const sub = subCategories.find((s) => String(s.id) === String(partnerSubCatId));
    if (sub) {
      if (sub.icon_img) return makeFullUrl(sub.icon_img);
      if (sub.img) return makeFullUrl(sub.img);
    }

    return "https://via.placeholder.com/600x300?text=No+Image";
  };

  // build counts map by subcategory id (string keys)
  const countsBySubId = React.useMemo(() => {
    const map = {};
    allPartnersForCounts.forEach((p) => {
      const sid =
        p?.sub_category?.id ??
        (typeof p?.sub_category === "number" ? p.sub_category : null) ??
        (p?.sub_category ? String(p.sub_category) : null);
      const key = sid ? String(sid) : "all";
      map[key] = (map[key] || 0) + 1;
    });
    map["all"] = allPartnersForCounts.length;
    return map;
  }, [allPartnersForCounts]);

  // icon mapper
  const iconForName = (name = "") => {
    const n = String(name).toLowerCase();
    if (n.includes("hospital")) return "🏥";
    if (n.includes("clinic")) return "🏩";
    if (n.includes("medical")) return "🩺";
    if (n.includes("pharmacy")) return "💊";
    if (n.includes("lab")) return "🔬";
    if (n.includes("therapy")) return "💆";
    if (n.includes("events")) return "🎉";
    if (n.includes("education")) return "🎓";
    if (n.includes("dental")) return "🦷";
    if (n.includes("cardio")) return "❤️";
    if (n.includes("pediatric")) return "👶";
    if (n.includes("eye") || n.includes("optical")) return "👁️";
    return "🏷️";
  };

  // Helper to close offcanvas programmatically (after selecting)
  const closeOffcanvas = () => {
    const el = document.getElementById("filtersOffcanvas");
    if (!el) return;
    // bootstrap's Offcanvas instance
    try {
      // eslint-disable-next-line no-undef
      const bs = window.bootstrap?.Offcanvas.getInstance(el) || new window.bootstrap.Offcanvas(el);
      bs.hide();
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="container p-3">
      {/* MOBILE: floating filter button (visible only < md) */}
      <div className="d-md-none position-fixed" style={{ right: 16, top: 90, zIndex: 1100 }}>
        <button
          className="btn btn-success rounded-circle shadow-lg d-flex align-items-center justify-content-center"
          style={{ width: 48, height: 48 }}
          data-bs-toggle="offcanvas"
          data-bs-target="#filtersOffcanvas"
          aria-controls="filtersOffcanvas"
          title="Filters"
        >
          ☰
        </button>
      </div>

      {/* CATEGORY TABS (desktop/tablet) */}
      <ul className="nav mb-4 gap-3 d-none d-md-flex">
        {categories.map((cat) => (
          <li key={cat.id} className="nav-item">
            <button
              className={
                "btn bg-transparent px-2 py-1 fw-semibold " +
                (String(activeCategoryId) === String(cat.id)
                  ? "text-success border-bottom border-2 border-success"
                  : "text-secondary")
              }
              style={{
                borderRadius: "6px",
                transition: "all .2s",
              }}
              onClick={() => {
                setActiveCategoryId(cat.id);
                setActiveSubCategoryId(null);
              }}
              onMouseEnter={(e) => (e.target.style.background = "#f3f3f3")}
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>

      {/* HEADING + BADGE */}
      <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
        List of {categories.find((c) => String(c.id) === String(activeCategoryId))?.name || "—"}
        
      </h5>

      {/* PREMIUM SUBCATEGORY CHIPS (desktop/tablet) */}
      <div
        className="d-none d-md-flex align-items-center gap-2 mb-4"
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          paddingBottom: 6,
        }}
      >
        {/* ALL chip */}
        <button
          className="btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-2"
          onClick={() => {
            setActiveSubCategoryId(null);
          }}
          style={{
            background: activeSubCategoryId === null ? "linear-gradient(135deg,#0db36b,#0a8d54)" : "#ffffff",
            color: activeSubCategoryId === null ? "#fff" : "#333",
            boxShadow: activeSubCategoryId === null ? "0 6px 18px rgba(13,179,107,0.18)" : "none",
            transform: activeSubCategoryId === null ? "scale(1.02)" : "none",
            border: activeSubCategoryId === null ? "none" : "1px solid rgba(0,0,0,0.08)",
            transition: "all .18s ease",
            minWidth: 90,
          }}
          title="Show all"
        >
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ fontSize: 13 }}>All</span>
          <span className="badge bg-light text-dark ms-2" style={{ fontSize: 12 }}>
            {countsBySubId["all"] ?? 0}
          </span>
        </button>

        {subCategories.map((sub) => {
          const active = String(activeSubCategoryId) === String(sub.id);
          const count = countsBySubId[String(sub.id)] ?? 0;
          return (
            <button
              key={sub.id}
              className="btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-2"
              onClick={() => setActiveSubCategoryId(sub.id)}
              style={{
                background: active ? "linear-gradient(135deg,#0db36b,#0a8d54)" : "#ffffff",
                color: active ? "#fff" : "#333",
                boxShadow: active ? "0 6px 18px rgba(13,179,107,0.18)" : "0 1px 3px rgba(0,0,0,0.04)",
                border: active ? "none" : "1px solid rgba(0,0,0,0.08)",
                transform: active ? "scale(1.02)" : "none",
                transition: "all .18s ease",
                minWidth: 110,
              }}
              title={sub.name}
            >
              <span style={{ fontSize: 16 }}>{iconForName(sub.name)}</span>
              <span style={{ fontSize: 13 }}>{sub.name}</span>
              <span className="badge bg-light text-dark ms-2" style={{ fontSize: 12 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* OFFCANVAS SIDEBAR (mobile) */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="filtersOffcanvas"
        aria-labelledby="filtersOffcanvasLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="filtersOffcanvasLabel">
            Filters
          </h5>
          <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          {/* Categories inside offcanvas */}
          <div className="mb-3">
            <h6 className="small text-muted">Categories</h6>
            <div className="d-flex flex-column gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={
                    "btn text-start " +
                    (String(activeCategoryId) === String(cat.id) ? "btn-success text-white" : "btn-light")
                  }
                  onClick={() => {
                    setActiveCategoryId(cat.id);
                    setActiveSubCategoryId(null);
                    // close offcanvas to show results
                    closeOffcanvas();
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory chips inside offcanvas */}
          <div className="mb-3">
            <h6 className="small text-muted">Subcategories</h6>
            <div className="d-flex flex-column gap-2">
              <button
                className={"btn text-start " + (activeSubCategoryId === null ? "btn-success text-white" : "btn-light")}
                onClick={() => {
                  setActiveSubCategoryId(null);
                }}
              >
                ⭐ All <span className="badge bg-light text-dark ms-2">{countsBySubId["all"] ?? 0}</span>
              </button>

              {subCategories.map((sub) => {
                const active = String(activeSubCategoryId) === String(sub.id);
                const count = countsBySubId[String(sub.id)] ?? 0;
                return (
                  <button
                    key={sub.id}
                    className={"btn text-start " + (active ? "btn-success text-white" : "btn-light")}
                    onClick={() => {
                      setActiveSubCategoryId(sub.id);
                    }}
                  >
                    <span style={{ fontSize: 16, marginRight: 8 }}>{iconForName(sub.name)}</span>
                    {sub.name}
                    <span className="badge bg-light text-dark ms-2">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button
              className="btn btn-success flex-grow-1"
              onClick={() => {
                // apply and close
                closeOffcanvas();
              }}
            >
              Apply
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setActiveSubCategoryId(null);
                closeOffcanvas();
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* PARTNER LISTING */}
      <div className="row mt-2">
        {partners.map((p) => (
          <div className="col-md-4 col-12 mb-4" key={p.id || p.PartnerMaster_id || Math.random()}>
            <div className="card shadow-sm h-100">
              {/* IMAGE SECTION */}
              <div className="position-relative overflow-hidden rounded-top">
                <span className="badge bg-success position-absolute top-0 start-0 ms-2 mt-2" style={{ zIndex: 5 }}>
                  Standard
                </span>

                <span className="badge bg-dark position-absolute top-0 end-0 me-2 mt-2" style={{ zIndex: 5 }}>
                  {p.reviews ? `${p.reviews} reviews` : `${p.rating || 0} ★`}
                </span>

                <img
                  src={getPartnerImage(p)}
                  alt={getPartnerName(p)}
                  className="img-fluid w-100 d-block"
                  style={{ height: 180, objectFit: "cover" }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://via.placeholder.com/600x300?text=No+Image";
                  }}
                />

                <div className="position-absolute bottom-0 start-0 m-2 d-flex gap-2">
                  <button className="btn btn-sm btn-light border" title="Compare">☐</button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getPartnerAddress(p))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-light border"
                    title="Map"
                  >
                    🗺
                  </a>
                  <button className="btn btn-sm btn-light border" title="Call">📞</button>
                  <button className="btn btn-sm btn-light border" title="WhatsApp">💬</button>
                </div>
              </div>

              <div className="card-body">
                <h6 className="fw-bold">{getPartnerName(p)}</h6>
                <p className="small text-danger">📍 {getPartnerAddress(p)}</p>
                <p className="small text-muted mb-1">Type: {getPartnerType(p)}</p>

                <div className="mb-2">
                  <span className="badge bg-success me-2">{p.rating || 0} ★</span>
                  <span className="text-muted small">{p.reviews || 0} reviews</span>
                </div>

                <div className="d-flex gap-2 mt-3 flex-wrap">
                  <button className="btn btn-sm btn-outline-primary">☐ Compare</button>
                  <button className="btn btn-sm btn-outline-success">🗺</button>
                  <button className="btn btn-sm btn-outline-success">📞</button>
                  <button className="btn btn-sm btn-outline-success">💬</button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {partners.length === 0 && <p className="text-muted">No partners found.</p>}
      </div>
    </div>
  );
};

export default MedicalFacilityListingBootstrap;
