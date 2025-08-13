/**
@license MIT
@author Starexx
*/
        let iconsData = [];
        let filteredData = [];
        let currentPage = 0;
        const itemsPerPage = 100; // per page icon H5/V99
        let uniqueFilters = {
            itemType: new Set(),
            Rare: new Set(),
            collectionType: new Set()
        };
        let lastClickedCard = null;
        let modalOpen = false;
        let currentSort = 'rarity'; // Sort !id, !name, !rarity,
        let currentTypeFilter = '';
        let currentCollectionFilter = '';
        let currentRarityFilter = '';

        document.addEventListener("DOMContentLoaded", () => {
            setTimeout(() => {
                document.getElementById("loadingDot").style.display = "none";
                document.getElementById("container").style.display = "block";
            }, 1000);

            fetchIcons();
            
            document.getElementById("menuButton").addEventListener("click", toggleSidebar);
            document.getElementById("sidebarClose").addEventListener("click", toggleSidebar);
            document.getElementById("search").addEventListener("input", filterIcons);
            
            // Setup menu toggles
            document.getElementById("rarityMenu").addEventListener("click", () => toggleSubmenu('rarity'));
            document.getElementById("sortMenu").addEventListener("click", () => toggleSubmenu('sort'));
            document.getElementById("collectionsMenu").addEventListener("click", () => toggleSubmenu('collections'));
            document.getElementById("typesMenu").addEventListener("click", () => toggleSubmenu('types'));

            document.addEventListener('touchmove', function(e) {
                if (modalOpen) {
                    e.preventDefault();
                }
            }, { passive: false });
        });
        
        function toggleSubmenu(type) {
            const menuItem = document.getElementById(`${type}Menu`);
            const submenu = document.getElementById(`${type}Submenu`);
            
            menuItem.classList.toggle('active');
            submenu.classList.toggle('open');
        }

        function toggleSidebar() {
            const sidebar = document.getElementById("sidebar");
            sidebar.classList.toggle("open");
            
            // Change menu button color when sidebar is open
            const menuButton = document.getElementById("menuButton");
            if (sidebar.classList.contains("open")) {
                menuButton.innerHTML = '<i class="fas fa-bars" style="color:#F9F9F9"></i>';
            } else {
                menuButton.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }

        async function fetchIcons() {
            try {
                const response = await fetch("https://raw.githubusercontent.com/9112000/FFItems/74c2af66d691776c2452bd72ca0388ba52d7c5fb/assets/itemData.json");
                const data = await response.json();
                // Map of itemData.json
                iconsData = data.map(item => ({
                    itemId: item["itemID"],
                    name: item["description"],
                    iconName: item["icon"],
                    description: item["description"],
                    description2: item["description2"],
                    itemType: item["itemType"] ? item["itemType"].replace(/_/g, ' ') : '',
                    collectionType: item["collectionType"] ? item["collectionType"].replace(/_/g, ' ') : '',
                    Rare: item["Rare"],
                    imageUrl: `https://raw.githubusercontent.com/usggffgg/GMG-ICONS/main/ICONS/${item["itemID"]}.png`
                }));

                iconsData.forEach(item => {
                    if (item.itemType) uniqueFilters.itemType.add(item.itemType);
                    if (item.Rare) uniqueFilters.Rare.add(item.Rare);
                    if (item.collectionType) uniqueFilters.collectionType.add(item.collectionType);
                });

                populateFilterButtons("filter-Rare-buttons", uniqueFilters.Rare, "Rare");
                populateFilterButtons("filter-sort-buttons", new Set(["ID", "Name", "Rarity"]), "sort");
                populateFilterButtons("filter-collectionType-buttons", uniqueFilters.collectionType, "collectionType");
                populateFilterButtons("filter-itemType-buttons", uniqueFilters.itemType, "itemType");
                
                populateFilterTabs();

                filteredData = [...iconsData];
                sortIcons();
                renderIcons();
                
                const searchParams = new URLSearchParams(window.location.search);
                const query = searchParams.get('q');
                if (query) {
                    document.getElementById('search').value = query;
                    filterIcons();
                }
            } catch (error) {
                console.error("Failed to retrieve Icons:", error);
                showError();
            }
        }
        
        function populateFilterButtons(containerId, values, filterType) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            
            Array.from(values).sort().forEach(value => {
                if (!value) return;
                
                const button = document.createElement("button");
                button.className = 'sidebar-filter-button';
                button.textContent = value;
                button.dataset.filterType = filterType;
                button.dataset.filterValue = value;
                
                button.onclick = function() {
                    // Toggle active state
                    const buttons = container.querySelectorAll('.sidebar-filter-button');
                    buttons.forEach(btn => btn.classList.remove('active'));
                    
                    if (filterType === 'sort') {
                        // For sort buttons, always keep one active
                        button.classList.add('active');
                        currentSort = value.toLowerCase();
                        sortIcons();
                        renderIcons();
                    } else {
                        // For other filters, toggle and apply filters
                        const isActive = button.classList.contains('active');
                        buttons.forEach(btn => btn.classList.remove('active'));
                        
                        if (!isActive) {
                            button.classList.add('active');
                            
                            if (filterType === 'Rare') {
                                currentRarityFilter = value;
                            } else if (filterType === 'collectionType') {
                                currentCollectionFilter = value;
                            } else if (filterType === 'itemType') {
                                currentTypeFilter = value;
                            }
                        } else {
                            if (filterType === 'Rare') {
                                currentRarityFilter = '';
                            } else if (filterType === 'collectionType') {
                                currentCollectionFilter = '';
                            } else if (filterType === 'itemType') {
                                currentTypeFilter = '';
                            }
                        }
                        
                        applyFilters();
                    }
                };
                
                // Set initial active state for sort buttons
                if (filterType === 'sort' && value.toLowerCase() === currentSort) {
                    button.classList.add('active');
                }
                
                container.appendChild(button);
            });
        }
        
        function populateFilterTabs() {
            const filterTabs = document.getElementById("filterTabs");
            filterTabs.innerHTML = '';
            
            // Add "All" tab
            const allTab = document.createElement("button");
            allTab.className = 'filter-tab active';
            allTab.textContent = 'ALL';
            allTab.onclick = () => {
                // Reset all filters
                currentTypeFilter = '';
                currentCollectionFilter = '';
                currentRarityFilter = '';
                
                // Update active states
                document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
                allTab.classList.add('active');
                
                // Reset all filter buttons
                document.querySelectorAll('.sidebar-filter-button').forEach(btn => {
                    if (btn.dataset.filterType !== 'sort') {
                        btn.classList.remove('active');
                    }
                });
                
                applyFilters();
            };
            filterTabs.appendChild(allTab);
            
            // Add type tabs
            Array.from(uniqueFilters.itemType).sort().forEach(type => {
                if (!type) return;
                const tab = document.createElement("button");
                tab.className = 'filter-tab';
                tab.textContent = type;
                tab.onclick = () => {
                    currentTypeFilter = type;
                    currentCollectionFilter = '';
                    currentRarityFilter = '';
                    
                    // Update active states
                    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    // Reset all filter buttons except sort
                    document.querySelectorAll('.sidebar-filter-button').forEach(btn => {
                        if (btn.dataset.filterType !== 'sort') {
                            btn.classList.remove('active');
                        }
                    });
                    
                    // Activate corresponding filter button
                    const typeButton = document.querySelector(`.sidebar-filter-button[data-filter-value="${type}"]`);
                    if (typeButton) typeButton.classList.add('active');
                    
                    applyFilters();
                };
                filterTabs.appendChild(tab);
            });
            
            // Add collection tabs
            Array.from(uniqueFilters.collectionType).sort().forEach(collection => {
                if (!collection) return;
                const tab = document.createElement("button");
                tab.className = 'filter-tab';
                tab.textContent = collection;
                tab.onclick = () => {
                    currentCollectionFilter = collection;
                    currentTypeFilter = '';
                    currentRarityFilter = '';
                    
                    // Update active states
                    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    // Reset all filter buttons except sort
                    document.querySelectorAll('.sidebar-filter-button').forEach(btn => {
                        if (btn.dataset.filterType !== 'sort') {
                            btn.classList.remove('active');
                        }
                    });
                    
                    // Activate corresponding filter button
                    const collectionButton = document.querySelector(`.sidebar-filter-button[data-filter-value="${collection}"]`);
                    if (collectionButton) collectionButton.classList.add('active');
                    
                    applyFilters();
                };
                filterTabs.appendChild(tab);
            });
        }

        function showError() {
            const grid = document.getElementById("iconGrid");
            grid.innerHTML = `<div class="no-results">Failed to load items. Please try again later.</div>`;
        }

        function applyFilters() {
            const searchQuery = document.getElementById("search").value.toLowerCase();
            
            filteredData = iconsData.filter(item => {
                const matchesSearch = searchQuery === '' || 
                    item.name.toLowerCase().includes(searchQuery) ||
                    item.itemId.toString().includes(searchQuery) ||
                    item.iconName.toLowerCase().includes(searchQuery);
                
                const matchesType = !currentTypeFilter || item.itemType === currentTypeFilter;
                const matchesRare = !currentRarityFilter || item.Rare === currentRarityFilter;
                const matchesCollection = !currentCollectionFilter || item.collectionType === currentCollectionFilter;
                
                return matchesSearch && matchesType && matchesRare && matchesCollection;
            });
            
            sortIcons();
            currentPage = 0;
            renderIcons();
        }
        
        function sortIcons() {
            if (currentSort === 'name') {
                filteredData.sort((a, b) => a.name.localeCompare(b.name));
            } else if (currentSort === 'id') {
                filteredData.sort((a, b) => a.itemId - b.itemId);
            } else if (currentSort === 'rarity') {
                const rarityOrder = {
                    'NONE': 1,
                    'WHITE': 2,
                    'BLUE': 3,
                    'GREEN': 4,
                    'ORANGE': 5,
                    'ORANGE_PLUS': 6,
                    'PURPLE': 7,
                    'PURPLE_PLUS': 8,
                    'RED': 9
                };
                
                filteredData.sort((a, b) => {
                    const aRarity = rarityOrder[a.Rare] || 0;
                    const bRarity = rarityOrder[b.Rare] || 0;
                    return bRarity - aRarity || a.itemId - b.itemId;
                });
            }
        }

        function renderIcons() {
            const start = currentPage * itemsPerPage;
            const end = start + itemsPerPage;
            const visibleIcons = filteredData.slice(start, end);
            
            const grid = document.getElementById("iconGrid");
            grid.innerHTML = "";

            if (filteredData.length === 0) {
                grid.innerHTML = `<div class="no-results">No items found matching your criteria</div>`;
                document.getElementById("pagination").innerHTML = "";
                return;
            }

            visibleIcons.forEach((icon, index) => {
                const card = document.createElement("div");
                card.className = "icon-card";
                card.dataset.index = start + index;
                card.onclick = (e) => {
                    document.querySelectorAll('.icon-card').forEach(c => {
                        c.classList.remove('active');
                    });
                    card.classList.add('active');
                    lastClickedCard = card;
                    openModal(
                        icon.name,
                        icon.itemId,
                        icon.iconName,
                        icon.imageUrl,
                        icon.description,
                        icon.description2,
                        icon.itemType,
                        icon.Rare
                    );
                };
                
                const img = document.createElement("img");
                img.src = icon.imageUrl;
                img.alt = icon.name;
                img.onerror = () => {
                    img.src = 'https://raw.githubusercontent.com/9112000/FFItems/19d339b0ec202ed4362128b91d51ec63b6ebfa73/assets/error-404.png';
                };
                card.appendChild(img);
                grid.appendChild(card);
            });

            updatePagination();
        }

        function updatePagination() {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            const paginationDiv = document.getElementById("pagination");
            paginationDiv.innerHTML = "";

            for (let i = 0; i < totalPages; i++) {
                const button = document.createElement("button");
                button.textContent = i + 1;
                button.classList.toggle("active", i === currentPage);
                button.onclick = () => changePage(i);
                paginationDiv.appendChild(button);
            }
        }

        function changePage(page) {
            currentPage = page;
            renderIcons();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function filterIcons() {
            applyFilters();
        }

        function openModal(name, itemId, iconName, imageUrl, description, description2, itemType, rare) {
            const modal = document.getElementById("modal");
            const modalImgContainer = document.getElementById("modalImgContainer");
            const modalTempImage = document.getElementById("modalTempImage");
            const modalContent = document.querySelector('.modal-content');
            
            document.getElementById("modalDescription").textContent = description || "No description available";
            document.getElementById("modalDescription2").textContent = description2 || "No additional description";
            document.getElementById("modalItemId").textContent = itemId || "Unknown";
            document.getElementById("modalIconName").textContent = iconName || "Unknown";
            document.getElementById("modalType").textContent = itemType || "Unknown";
            document.getElementById("modalRare").textContent = rare || "Unknown";
            
            const modalImg = document.getElementById("modalImage");
            modalImg.src = imageUrl;
            modalImg.onerror = () => {
                modalImg.src = 'https://raw.githubusercontent.com/starexxx/FFItems/19d339b0ec202ed4362128b91d51ec63b6ebfa73/assets/error-404.png';
            };
            
            modalTempImage.src = imageUrl;
            modalTempImage.onerror = () => {
                modalTempImage.src = 'https://raw.githubusercontent.com/starexxx/FFItems/19d339b0ec202ed4362128b91d51ec63b6ebfa73/assets/error-404.png';
            };
            
            const cardRect = lastClickedCard.getBoundingClientRect();
            const cardImg = lastClickedCard.querySelector('img');
            
            modalImgContainer.style.width = `${cardImg.width}px`;
            modalImgContainer.style.height = `${cardImg.height}px`;
            modalImgContainer.style.left = `${cardRect.left + (cardRect.width - cardImg.width)/2}px`;
            modalImgContainer.style.top = `${cardRect.top + (cardRect.height - cardImg.height)/2}px`;
            modalImgContainer.style.transform = 'none';
            
            modal.classList.add("show");
            document.body.style.overflow = "hidden";
            modalOpen = true;
            
            setTimeout(() => {
                const modalRect = modal.getBoundingClientRect();
                const targetLeft = modalRect.left + (modalRect.width - 100)/2;
                const targetTop = modalRect.top + 50;
                
                modalImgContainer.style.width = '100px';
                modalImgContainer.style.height = '100px';
                modalImgContainer.style.left = `${targetLeft}px`;
                modalImgContainer.style.top = `${targetTop}px`;
                
                setTimeout(() => {
                    modalContent.style.opacity = '1';
                }, 150);
            }, 10);
        }

        function closeModal() {
            const modal = document.getElementById("modal");
            const modalImgContainer = document.getElementById("modalImgContainer");
            const modalContent = document.querySelector('.modal-content');
            
            if (!lastClickedCard) {
                modal.classList.remove("show");
                document.body.style.overflow = "auto";
                modalOpen = false;
                return;
            }
            
            modalContent.style.opacity = '0';
            
            const cardRect = lastClickedCard.getBoundingClientRect();
            const cardImg = lastClickedCard.querySelector('img');
            
            modalImgContainer.style.width = `${cardImg.width}px`;
            modalImgContainer.style.height = `${cardImg.height}px`;
            modalImgContainer.style.left = `${cardRect.left + (cardRect.width - cardImg.width)/2}px`;
            modalImgContainer.style.top = `${cardRect.top + (cardRect.height - cardImg.height)/2}px`;
            modalImgContainer.style.transform = 'none';
            
            setTimeout(() => {
                modal.classList.remove("show");
                document.body.style.overflow = "auto";
                modalOpen = false;
            }, 300);
        }

        document.addEventListener('click', function(event) {
            const modal = document.getElementById('modal');
            if (event.target === modal && modalOpen) {
                closeModal();
            }
        });
