// import { useState, useCallback, useMemo, useEffect } from 'react';
// import styles from './ProductManager.module.css';
// import api from '../../services/api';

// interface Product {
//   shopProductId: number;
//   productId: number;
//   price: number;
//   stockQuantity: number;
//   productName: string;
//   productDescription: string;
//   categoryId?: number;
//   category?: string;
//   categoryName?: string;
//   product?: {
//     productName: string;
//     productDescription: string;
//     categoryId?: number;
//     category?: string;
//   };
// }

// interface Category {
//   id: string;
//   name: string;
//   icon: string;
// }

// interface ProductManagerProps {
//   shopId: number;
// }

// export const ProductManager = ({ shopId }: ProductManagerProps) => {
//   const [showProducts, setShowProducts] = useState(false);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [name, setName] = useState('');
//   const [desc, setDesc] = useState('');
//   const [price, setPrice] = useState<number>(0);
//   const [stock, setStock] = useState<number>(0);
//   const [selectedCategory, setSelectedCategory] = useState<string>('all');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Simplified categories - just for filtering
//   const categories: Category[] = [
//     { id: 'all', name: 'All Products', icon: '📦' },
//     { id: 'food', name: 'Food', icon: '🍖' },
//     { id: 'toys', name: 'Toys', icon: '🧸' },
//     { id: 'accessories and apparel', name: 'Accessories', icon: '🎀' },
//     { id: 'health and hygiene', name: 'Health', icon: '💊' },
//     { id: 'grooming', name: 'Grooming', icon: '✂️' },
//     { id: 'beds and crates', name: 'Beds', icon: '🛏️' },
//     { id: 'treats', name: 'Treats', icon: '🍬' },
//     { id: 'litter', name: 'Litter', icon: '💩' },
//     { id: 'household care', name: 'Household Care', icon: '🧹' },
//   ];

//   const fetchProducts = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await api.get(`/Product/shop/${shopId}`);
//       const data = response.data;
      
//       if (Array.isArray(data)) {
//         const processedData = data.map((item: any) => ({
//           shopProductId: item.shopProductId,
//           productId: item.productId,
//           price: item.price,
//           stockQuantity: item.stockQuantity,
//           productName: item.productName || "Unknown",
//           productDescription: item.productDescription || "No description",
//           categoryId: item.categoryId,
//           category: getCategoryNameFromId(item.categoryId),
//         }));
//         setProducts(processedData);
//       } else {
//         setProducts([]);
//       }
//     } catch (err: any) {
//       setError(err.response?.data?.message || err.message || 'Failed to fetch products');
//     } finally {
//       setLoading(false);
//     }
//   }, [shopId]);

//   // Force fetch on mount if shopId is available
//   useEffect(() => {
//     if (shopId > 0 && showProducts) {
//       fetchProducts();
//     }
//   }, [shopId, showProducts, fetchProducts]);

//   // Helper function to map categoryId to category name
//   const getCategoryNameFromId = (categoryId?: number): string => {
//     const categoryMap: { [key: number]: string } = {
//       1: 'food',
//       2: 'toys',
//       3: 'accessories and apparel',
//       4: 'health and hygiene',
//       5: 'grooming',
//       6: 'beds and crates',
//       7: 'treats',
//       8: 'litter',
//       9: 'household care',
//     };
//     return categoryId ? categoryMap[categoryId] || 'uncategorized' : 'uncategorized';
//   };

//   const handleDelete = async (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this product?")) return;
    
//     try {
//       await api.delete(`/Product/delete/${id}`, {
//         headers: {
//           'X-ShopId': shopId.toString()
//         }
//       });
//       setProducts(prev => prev.filter(p => p.shopProductId !== id));
//     } catch (error) {
//       console.error("Delete error:", error);
//       alert('Error deleting product');
//     }
//   };

//   const handleAddProduct = async () => {
//     if (!name || price <= 0) {
//       alert('Please fill in all required fields');
//       return;
//     }
    
//     setSubmitting(true);
//     try {
//       const categoryId = getCategoryIdFromName(selectedCategory);
      
//       await api.post(`/Product/add`, {
//         productName: name,
//         description: desc,
//         price: price,
//         stockQuantity: stock,
//         currency: "EGP",
//         categoryId: categoryId,
//         isActive: true
//       }, {
//         headers: { 
//           'X-ShopId': shopId.toString()
//         }
//       });

//       setName('');
//       setDesc('');
//       setPrice(0);
//       setStock(0);
//       setSelectedCategory('all');
//       setShowAddForm(false);
//       await fetchProducts();
//     } catch (error) {
//       console.error("Add error:", error);
//       alert('Error adding product');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Helper function to map category name to ID
//   const getCategoryIdFromName = (categoryName: string): number => {
//     const categoryMap: { [key: string]: number } = {
//       'food': 1,
//       'toys': 2,
//       'accessories and apparel': 3,
//       'health and hygiene': 4,
//       'grooming': 5,
//       'beds and crates': 6,
//       'treats': 7,
//       'litter': 8,
//       'household care': 9,
//     };
//     return categoryMap[categoryName] || 0;
//   };

//   const handleUpdate = async () => {
//     if (!editingProduct) return;
    
//     setSubmitting(true);
//     try {
//       await api.put(`/Product/update/${editingProduct.shopProductId}`, {
//         price: editingProduct.price,
//         stockQuantity: editingProduct.stockQuantity,
//         categoryId: getCategoryIdFromName(editingProduct.category || ''),
//         isActive: true,
//         currency: "EGP"
//       }, {
//         headers: { 
//           'X-ShopId': shopId.toString()
//         }
//       });

//       handleCloseModal(); 
//       await fetchProducts();
//     } catch (error) {
//       console.error("Update error:", error);
//       alert('Error updating product');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Filter products by category and search term
//   const filteredProducts = useMemo(() => {
//     let filtered = products;
    
//     // Apply category filter
//     if (selectedCategory !== 'all') {
//       filtered = filtered.filter(p => p.category === selectedCategory);
//     }
    
//     // Apply search filter
//     if (searchTerm) {
//       filtered = filtered.filter(p => 
//         p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         p.productDescription.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }
    
//     return filtered;
//   }, [products, selectedCategory, searchTerm]);

//   const stats = useMemo(() => {
//     const productsToCount = selectedCategory === 'all' && !searchTerm ? products : filteredProducts;
//     return {
//       total: productsToCount.length,
//       lowStock: productsToCount.filter(p => p.stockQuantity < 5 && p.stockQuantity > 0).length,
//       outOfStock: productsToCount.filter(p => p.stockQuantity === 0).length,
//       totalValue: productsToCount.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0),
//     };
//   }, [products, filteredProducts, selectedCategory, searchTerm]);

//   const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       action();
//     }
//   };

//   // Get category icon
//   const getCategoryIcon = (category?: string) => {
//     const cat = categories.find(c => c.id === category);
//     return cat?.icon || '📦';
//   };

//   const handleViewProductsClick = () => {
//     if (showProducts) {
//       // If currently showing, just hide
//       setShowProducts(false);
//     } else {
//       // If currently hidden, fetch and show
//       fetchProducts();
//       setShowProducts(true);
//     }
//   };

//   const handleEditClick = (product: Product) => {
//     setEditingProduct(product);
//     setShowEditModal(true);
//     // Prevent body scrolling when modal is open
//     document.body.style.overflow = 'hidden';
//   };

//   const handleCloseModal = () => {
//     setShowEditModal(false);
//     setEditingProduct(null);
//     // Restore body scrolling
//     document.body.style.overflow = 'unset';
//   };

//   return (
//     <div className={styles.container}>
//       <div className={styles.content}>
//         {/* Header */}
//         <div className={styles.header}>
//           <div className={styles.headerLeft}>
//             <div className={styles.headerIcon}>📦</div>
//             <div>
//               <h1 className={styles.title}>Manage Products</h1>
//               <p className={styles.subtitle}>Manage your inventory</p>
//             </div>
//           </div>
//         </div>

//         {/* Simple Category Filter - Clean and minimal */}
//         <div className={styles.filterBar}>
//           <div className={styles.filterTabs}>
//             {categories.map(category => (
//               <button
//                 key={category.id}
//                 onClick={() => setSelectedCategory(category.id)}
//                 className={`${styles.filterTab} ${selectedCategory === category.id ? styles.activeTab : ''}`}
//               >
//                 <span>{category.icon}</span>
//                 {category.name}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Action Bar */}
//         <div className={styles.actionBar}>
//           <button
//             onClick={handleViewProductsClick}
//             className={`${styles.button} ${showProducts ? styles.buttonSecondary : styles.buttonPrimary}`}
//           >
//             <span className={styles.buttonIcon}>{showProducts ? '👁️' : '📦'}</span>
//             {showProducts ? 'Hide Products' : 'View Products'}
//           </button>

//           {showProducts && (
//             <button
//               onClick={() => {
//                 setShowAddForm(!showAddForm);
//                 setShowEditModal(false);
//                 setEditingProduct(null);
//               }}
//               className={`${styles.button} ${showAddForm ? styles.buttonSecondary : styles.buttonPrimary}`}
//             >
//               <span className={styles.buttonIcon}>{showAddForm ? '✕' : '+'}</span>
//               {showAddForm ? 'Cancel' : 'Add Product'}
//             </button>
//           )}
//         </div>

//         {/* Error Banner */}
//         {error && (
//           <div className={styles.errorBanner}>
//             <span>⚠️ {error}</span>
//             <button onClick={fetchProducts}>Retry</button>
//           </div>
//         )}

//         {/* Stats */}
//         {showProducts && !loading && products.length > 0 && (
//           <div className={styles.statsContainer}>
//             <div className={styles.statCard}>
//               <div className={styles.statValue}>{stats.total}</div>
//               <div className={styles.statLabel}>Total Products</div>
//             </div>
//             <div className={styles.statCard}>
//               <div className={styles.statValue} style={{ color: stats.lowStock > 0 ? '#f72585' : '#4cc9f0' }}>
//                 {stats.lowStock}
//               </div>
//               <div className={styles.statLabel}>Low Stock</div>
//             </div>
//             <div className={styles.statCard}>
//               <div className={styles.statValue}>{stats.outOfStock}</div>
//               <div className={styles.statLabel}>Out of Stock</div>
//             </div>
//             <div className={styles.statCard}>
//               <div className={styles.statValue}>{stats.totalValue.toLocaleString()} EGP</div>
//               <div className={styles.statLabel}>Inventory Value</div>
//             </div>
//           </div>
//         )}

//         {/* Add Form */}
//         {showAddForm && (
//           <div className={styles.formOverlay}>
//             <h2 className={styles.formTitle}>
//               <span>✨</span> Add New Product
//             </h2>
//             <div className={styles.formGrid}>
//               <div className={styles.formGroup}>
//                 <label className={styles.formLabel}>
//                   Product Name <span>*</span>
//                 </label>
//                 <input
//                   placeholder="e.g., Premium Dog Food"
//                   value={name}
//                   onChange={e => setName(e.target.value)}
//                   onKeyDown={(e) => handleKeyPress(e, handleAddProduct)}
//                   className={styles.input}
//                   autoFocus
//                 />
//               </div>
//               <div className={styles.formGroup}>
//                 <label className={styles.formLabel}>Description</label>
//                 <input
//                   placeholder="Brief description..."
//                   value={desc}
//                   onChange={e => setDesc(e.target.value)}
//                   onKeyDown={(e) => handleKeyPress(e, handleAddProduct)}
//                   className={styles.input}
//                 />
//               </div>
//               <div className={styles.formGroup}>
//                 <label className={styles.formLabel}>
//                   Price (EGP) <span>*</span>
//                 </label>
//                 <input
//                   type="number"
//                   placeholder="0.00"
//                   value={price || ''}
//                   onChange={e => setPrice(Number(e.target.value))}
//                   onKeyDown={(e) => handleKeyPress(e, handleAddProduct)}
//                   className={styles.input}
//                   min="0"
//                   step="0.01"
//                 />
//               </div>
//               <div className={styles.formGroup}>
//                 <label className={styles.formLabel}>Stock Quantity</label>
//                 <input
//                   type="number"
//                   placeholder="0"
//                   value={stock || ''}
//                   onChange={e => setStock(Number(e.target.value))}
//                   onKeyDown={(e) => handleKeyPress(e, handleAddProduct)}
//                   className={styles.input}
//                   min="0"
//                 />
//               </div>
//               <div className={styles.formGroup}>
//                 <label className={styles.formLabel}>Category</label>
//                 <select
//                   value={selectedCategory}
//                   onChange={(e) => setSelectedCategory(e.target.value)}
//                   className={styles.input}
//                 >
//                   {categories.filter(c => c.id !== 'all').map(cat => (
//                     <option key={cat.id} value={cat.id}>
//                       {cat.icon} {cat.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//             <button
//               onClick={handleAddProduct}
//               disabled={submitting || !name || price <= 0}
//               className={`${styles.button} ${styles.buttonPrimary}`}
//               style={{ width: '100%', justifyContent: 'center', padding: '1.2rem' }}
//             >
//               {submitting ? 'Adding...' : 'Save Product'}
//             </button>
//           </div>
//         )}

//         {/* Products Display */}
//         {showProducts && (
//           <div>
//             {/* Search */}
//             {products.length > 0 && (
//               <div className={styles.searchContainer}>
//                 <div className={styles.searchBox}>
//                   <span className={styles.searchIcon}>🔍</span>
//                   <input
//                     type="text"
//                     placeholder="Search products by name or description..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className={styles.searchInput}
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Products Grid */}
//             {loading ? (
//               <div className={styles.loadingState}>
//                 <div className={styles.loadingSpinner}></div>
//                 <p>Loading your products...</p>
//               </div>
//             ) : products.length === 0 ? (
//               <div className={styles.emptyState}>
//                 <div className={styles.emptyStateIcon}>📦</div>
//                 <h3 className={styles.emptyStateTitle}>No Products Yet</h3>
//                 <p className={styles.emptyStateText}>
//                   Get started by adding your first product to the inventory.
//                 </p>
//                 <button
//                   onClick={() => setShowAddForm(true)}
//                   className={`${styles.button} ${styles.buttonPrimary}`}
//                 >
//                   <span className={styles.buttonIcon}>+</span>
//                   Add Your First Product
//                 </button>
//               </div>
//             ) : (
//               <>
//                 {(searchTerm || selectedCategory !== 'all') && (
//                   <div className={styles.productsHeader}>
//                     <p className={styles.productsCount}>
//                       Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
//                       {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
//                     </p>
//                     {filteredProducts.length === 0 && (
//                       <button
//                         onClick={() => {
//                           setSearchTerm('');
//                           setSelectedCategory('all');
//                         }}
//                         className={`${styles.button} ${styles.buttonSecondary}`}
//                         style={{ padding: '0.4rem 1rem' }}
//                       >
//                         Clear Filters
//                       </button>
//                     )}
//                   </div>
//                 )}

//                 <div className={styles.grid}>
//                   {filteredProducts.map(p => (
//                     <div key={p.shopProductId} className={styles.productCard}>
//                       <span className={styles.productBadge}>ID: {p.shopProductId}</span>
//                       {p.stockQuantity < 5 && p.stockQuantity > 0 && (
//                         <span className={styles.lowStockBadge}>
//                           ⚡ Low Stock
//                         </span>
//                       )}
//                       {p.stockQuantity === 0 && (
//                         <span className={styles.lowStockBadge} style={{ background: '#f72585' }}>
//                           ⚠️ Out of Stock
//                         </span>
//                       )}

//                       <div className={styles.productContent}>
//                         <h3 className={styles.productName} title={p.productName}>
//                           {p.productName}
//                         </h3>
//                         <p className={styles.productDesc} title={p.productDescription}>
//                           {p.productDescription}
//                         </p>

//                         <div className={styles.productMeta}>
//                           <div className={styles.metaRow}>
//                             <span className={styles.metaLabel}>Price</span>
//                             <span className={styles.price}>
//                               {p.price.toLocaleString()} <span className={styles.currency}>EGP</span>
//                             </span>
//                           </div>
//                           <div className={styles.metaRow}>
//                             <span className={styles.metaLabel}>Stock</span>
//                             <span className={`${styles.stock} ${p.stockQuantity < 5 ? styles.stockLow : styles.stockNormal}`}>
//                               {p.stockQuantity} units
//                             </span>
//                           </div>
//                           <div className={styles.metaRow}>
//                             <span className={styles.metaLabel}>Category</span>
//                             <span className={styles.categoryTag}>
//                               {getCategoryIcon(p.category)} {p.category || 'Uncategorized'}
//                             </span>
//                           </div>
//                         </div>
//                       </div>

//                       <div className={styles.cardActions}>
//                         <button 
//                           className={styles.editButton}
//                           onClick={() => handleEditClick(p)}
//                         >
//                           <span>✏️</span> Edit
//                         </button>
//                         <button
//                           onClick={() => handleDelete(p.shopProductId)}
//                           className={styles.deleteButton}
//                           title="Delete product"
//                         >
//                           🗑️
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//         )}

//         {/* Edit Modal - Now appears as a popup */}
//         {showEditModal && editingProduct && (
//           <div 
//             className={styles.modalOverlay} 
//             onClick={handleCloseModal}
//           >
//             <div 
//               className={styles.modalContent} 
//               onClick={(e) => {
//                 e.stopPropagation();
//                 e.preventDefault();
//               }}
//             >
//               <div className={styles.modalHeader}>
//                 <h2 className={styles.modalTitle}>
//                   <span>✏️</span> Edit {editingProduct.productName}
//                 </h2>
//                 <button 
//                   className={styles.modalCloseButton}
//                   onClick={handleCloseModal}
//                   disabled={submitting}
//                 >
//                   ✕
//                 </button>
//               </div>
              
//               <div className={styles.modalBody}>
//                 <div className={styles.formGrid}>
//                   <div className={styles.formGroup}>
//                     <label className={styles.formLabel}>
//                       Price (EGP) <span>*</span>
//                     </label>
//                     <input
//                       type="number"
//                       value={editingProduct.price || ''}
//                       onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
//                       onKeyDown={(e) => handleKeyPress(e, handleUpdate)}
//                       className={styles.input}
//                       min="0"
//                       step="0.01"
//                       autoFocus
//                       disabled={submitting}
//                     />
//                   </div>
//                   <div className={styles.formGroup}>
//                     <label className={styles.formLabel}>Stock Quantity</label>
//                     <input
//                       type="number"
//                       value={editingProduct.stockQuantity || ''}
//                       onChange={e => setEditingProduct({...editingProduct, stockQuantity: Number(e.target.value)})}
//                       onKeyDown={(e) => handleKeyPress(e, handleUpdate)}
//                       className={styles.input}
//                       min="0"
//                       disabled={submitting}
//                     />
//                   </div>
//                   <div className={styles.formGroup}>
//                     <label className={styles.formLabel}>Category</label>
//                     <select
//                       value={editingProduct.category || 'uncategorized'}
//                       onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
//                       className={styles.input}
//                       disabled={submitting}
//                     >
//                       {categories.filter(c => c.id !== 'all').map(cat => (
//                         <option key={cat.id} value={cat.id}>
//                           {cat.icon} {cat.name}
//                         </option>
//                       ))}
//                       <option value="uncategorized">📦 Uncategorized</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               <div className={styles.modalFooter}>
//                 <button
//                   onClick={handleCloseModal}
//                   className={`${styles.button} ${styles.buttonSecondary}`}
//                   disabled={submitting}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleUpdate}
//                   disabled={submitting}
//                   className={`${styles.button} ${styles.buttonPrimary}`}
//                 >
//                   {submitting ? 'Updating...' : 'Update Product'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };