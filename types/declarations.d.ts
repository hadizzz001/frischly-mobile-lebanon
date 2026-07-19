// Ambient module declarations for third-party packages that ship without their
// own TypeScript types, so the strict compiler can resolve them.

declare module "react-native-vector-icons/Feather" {
	import type { Component } from "react";
	import type { TextProps } from "react-native";
	export interface IconProps extends TextProps {
		name: string;
		size?: number;
		color?: string;
	}
	export default class Icon extends Component<IconProps> {}
}

declare module "react-native-vector-icons/*" {
	import type { Component } from "react";
	import type { TextProps } from "react-native";
	export interface IconProps extends TextProps {
		name: string;
		size?: number;
		color?: string;
	}
	export default class Icon extends Component<IconProps> {}
}
