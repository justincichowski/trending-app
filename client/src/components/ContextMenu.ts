export class ContextMenu {
	private menuElement: HTMLElement;
	private imageUrl: string | null = null;
	private itemUrl: string | null = null;

	constructor(containerId: string) {
		const container = document.getElementById(containerId);
		if (!container) {
			throw new Error(`Container with id "${containerId}" not found.`);
		}
		this.menuElement = document.createElement('div');
		this.menuElement.id = 'custom-context-menu';
		this.menuElement.className = 'context-menu';
		container.appendChild(this.menuElement);

		this.hide = this.hide.bind(this);
		document.addEventListener('click', this.hide);
	}

	public show(x: number, y: number, imageUrl: string, itemUrl?: string) {
		this.imageUrl = imageUrl;
		this.itemUrl = itemUrl || null;
		this.render();
		this.menuElement.style.left = `${x}px`;
		this.menuElement.style.top = `${y}px`;
		this.menuElement.classList.add('show');
	}

	public hide() {
		this.menuElement.classList.remove('show');
		this.imageUrl = null;
		this.itemUrl = null;
	}

	private render() {
		let menuItems = '';

		if (this.itemUrl) {
			menuItems += `<li id="open-link-option">Open link in new tab</li>`;
		}

		menuItems += `<li id="save-image-option">Save Image</li>`;

		this.menuElement.innerHTML = `<ul>${menuItems}</ul>`;

		const openLinkOption = this.menuElement.querySelector('#open-link-option');
		if (openLinkOption && this.itemUrl) {
			openLinkOption.addEventListener('click', () => {
				window.open(this.itemUrl!, '_blank');
				this.hide();
			});
		}

		const saveImageOption = this.menuElement.querySelector('#save-image-option');
		if (saveImageOption) {
			saveImageOption.addEventListener('click', () => {
				if (this.imageUrl) {
					this.saveImage(this.imageUrl);
				}
				this.hide();
			});
		}
	}

	private async saveImage(url: string) {
		try {
			const response = await fetch(url, {
				method: 'GET', // or 'POST', depending on your API
				headers: {
					'Content-Type': 'application/json', // Make sure this header is allowed in CORS settings
				},
			});
			const blob = await response.blob();
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			const fileName = url.substring(url.lastIndexOf('/') + 1);
			link.download = fileName || 'downloaded-image';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);
		} catch (error) {
			console.error('Failed to save image:', error);
		}
	}
}
