
export interface MenuItem {
  title: string;
  section: string;
  icon: string;
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
}
