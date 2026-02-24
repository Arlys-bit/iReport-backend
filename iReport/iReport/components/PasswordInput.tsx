import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  placeholder?: string;
  iconColor?: string;
  containerStyle?: ViewStyle;
}

export default function PasswordInput({
  placeholder = 'Enter password',
  iconColor = '#666',
  containerStyle,
  style,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        {...props}
        placeholder={placeholder}
        secureTextEntry={!showPassword}
        style={[styles.input, style]}
      />
      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        style={styles.iconButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {showPassword ? (
          <EyeOff size={20} color={iconColor} />
        ) : (
          <Eye size={20} color={iconColor} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    paddingRight: 40,
  },
  iconButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
});
